import {onRequest, onCall} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const firestore = admin.firestore();

// https://firebase.google.com/docs/functions/typescript

exports.fitbitRefresher = onSchedule("every 6 hours", async () => {
  logger.info("Running fitbit refresher...");
  try {
    const usersSnapshot = await firestore.collection("users").get();

    const refreshTasks = usersSnapshot.docs.map(async (doc) => {
      const userID = doc.id;
      const refresh = doc.data().fitbitRefresh;
      const clientID = "23Q4VW";
      const clientSecret = "3c221d01a3b5b5ce0bcd56967aab9dfe";
      const authHeader = "Basic " + btoa(clientID + ":" + clientSecret);
      const structuredData = {
        grant_type: "refresh_token",
        client_id: clientID,
        refresh_token: refresh,
      };
      const response = await axios.post("https://api.fitbit.com/oauth2/token", structuredData, {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      await firestore.collection("users").doc(userID).update({
        fitbitAuth: response.data.access_token,
        fitbitRefresh: response.data.refresh_token,
      });
    });
    await Promise.all(refreshTasks);
    logger.info("Finished refreshing all tokens");
  } catch (error) {
    logger.error(error);
  }
});

exports.fitbitCallback = onRequest(async (request, response) => {
  try {
    if (request.query.state && request.query.code) {
      const fitbitUrl = "https://api.fitbit.com/oauth2/token";
      const clientID = "23Q4VW";
      const clientSecret = "3c221d01a3b5b5ce0bcd56967aab9dfe";
      const userID = String(request.query.state);
      const codeDoc = await admin.firestore()
        .collection("OAuth").doc(userID).get();
      if (!codeDoc.exists) {
        new Error("Could not find code doc.");
        return;
      }
      const codeDocData = codeDoc.data();
      if (!codeDocData) {
        new Error("Undefined data");
        return;
      }

      const PKCEcode = codeDocData.codeVerifier;
      const authHeader = "Basic " + btoa(clientID + ":" + clientSecret);
      const redirectURI = "https://us-central1-rica-68448.cloudfunctions.net/fitbitCallback";
      const structuredData = {
        code: request.query.code,
        grant_type: "authorization_code",
        code_verifier: PKCEcode,
        redirect_uri: redirectURI,
      };

      const fitbitApiResponse = await axios.post(fitbitUrl, structuredData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": authHeader,
        },
      });
      // Store access token, refresh token under userID
      // TODO maybe ensure scope here else deny
      await firestore.collection("users").doc(userID).update({
        fitbitAuth: fitbitApiResponse.data.access_token,
        fitbitRefresh: fitbitApiResponse.data.refresh_token,
        fitbitID: fitbitApiResponse.data.user_id,
      });
      await admin.firestore().collection("OAuth").doc(userID).delete();
    }
  } catch (error) {
    logger.error(error);
  }
  response.status(200)
    .send("User Authenticated! You may now close this window.");
});

exports.fitbitSubscription = onRequest(async (request, response) => {
  try {
    // Fitbit Subscription verification
    if (request.method == "GET") {
      const verify = request.query.verify;
      logger.info("Received verify: " + verify);
      const verifyCheck =
        "53029fa393e6e76805ac91d112be7298daf0d00ce24c1e1b3b012dcbe7c7d130";
      logger.info("Verify on record: " + verifyCheck);
      if (verify && verifyCheck == verify) {
        logger.log("Fitbit subscription verification:", verify);
        response.status(204).send(verify);
      } else {
        response.status(404).send("Incorrect verification code");
      }
    }

    // Handle updates
    if (request.method === "POST") {
      const body = request.body;

      // TODO: Verify the signature here for security

      logger.log("Received Fitbit subscription update:", body);

      // Process different subscription types
      for (const item of body) {
        const userId = item.ownerId; // Fitbit user ID
        const collectionPath = item.collectionType; // activities, sleep, etc.
        const date = item.date; // YYYY-MM-DD format

        // Store notification in Firestore
        await firestore.collection("fitbitSubscriptionNotifications")
          .doc(`${userId}_${collectionPath}_${date}`)
          .set({
            userId,
            collectionPath,
            date,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        logger
          .log(`Stored update for user ${userId}
          , ${collectionPath} on ${date}`);
      }

      response.status(204).send();
    }

    response.status(405).send("Method Not Allowed");
  } catch (error) {
    logger.error("Subscription error:", error);
    response.status(500).send("Internal Server Error");
  }
});

const sendAlerts = async (userID: string, name: string,
  type: string, threshold: number,
  observed: number) => {
  const alert = {
    userID: userID,
    name: name,
    type: type,
    threshold: threshold,
    observed: observed,
  };
  const userDoc = await admin.firestore().collection("users").doc(userID).get();
  const data = userDoc.data();
  if (data) {
    const list = data.friends || [];
    for (const item of list) {
      const friendDoc = await admin.firestore()
        .collection("users").doc(item).get();
      if (friendDoc.exists) {
        await Promise.all(list.map(async (item:string) => {
          const friendDoc = await admin.firestore()
            .collection("users").doc(item).get();
          if (friendDoc.exists) {
            try {
              await firestore.collection("users")
                .doc(item).collection("alerts").add(alert);
              logger.info("Alert sent to " + item + " from " + userID);
            } catch (err) {
              logger.error("Failed to send alert to " + item + ": " + err);
            }
          }
        }));
      }
    }
  }
};


exports.updateSteps = onCall(async (request) => {
  try {
    const requester = request.data.requester || "SYSTEM";
    const uid = request.data.userID;
    const currentDate = new Date().toISOString().split("T")[0];
    // Pull data from user document
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new Error("User document not found");
    }
    const userData = userDoc.data();
    const accessToken = userData?.fitbitAuth;
    const fitbitUID = userData?.fitbitID;
    if (!accessToken) {
      throw new Error("Fitbit access token not found");
    }

    logger.info("Received update steps from " +
      requester + " for user: " + uid);
    // Call for the data
    const endpoint = "https://api.fitbit.com/1/user" +
      "/" + fitbitUID + "/activities/steps/date/" +
      currentDate + "/" + currentDate + ".json";
    logger.info(endpoint);
    const response =
      await axios.get(endpoint, {// Changed to GET as this is a read endpoint
        headers: {
          "Authorization": "Bearer " + accessToken,
        },
      });
    // Update database
    logger.info(response);
    if (response.status === 200) {
      const [{value}] = response.data["activities-steps"];
      console.log("Value: " + value);
      await firestore.collection("users").doc(uid).collection("steps")
        .doc(currentDate)
        .set({
          value: value,
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  } catch (error) {
    logger.error(error);
  }
});

exports.updateHeart = onCall(async (request) => {
  try {
    const requester = request.data.requester || "SYSTEM";
    const uid = request.data.userID;
    const currentDate = new Date().toISOString().split("T")[0];
    // Pull data from user document
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new Error("User document not found");
    }
    const userData = userDoc.data();
    const accessToken = userData?.fitbitAuth;
    const fitbitUID = userData?.fitbitID;
    if (!accessToken) {
      throw new Error("Fitbit access token not found");
    }

    logger.info("Received update heart from " +
      requester + " for user: " + uid);
    // Call for the data
    const endpoint = "https://api.fitbit.com/1/user" +
      "/" + fitbitUID + "/activities/heart/date/" +
      currentDate + "/" + currentDate + ".json";
    logger.info(endpoint);
    const response =
      await axios.get(endpoint, {// Changed to GET as this is a read endpoint
        headers: {
          "Authorization": "Bearer " + accessToken,
        },
      });
    // Update database
    logger.info(response);

    type HeartRateZone = {
      min: number;
      max: number;
      name: string;
    };

    if (response.status === 200) {
      const zones:HeartRateZone[] = response
        .data["activities-heart"][0].value.heartRateZones;
      const outOfRange:HeartRateZone | undefined = zones
        .find((zone) => zone.name === "Out of Range");
      const midpointOutOfRange = outOfRange ?
        (outOfRange.min + outOfRange.max) / 2 : -1;

      const highestMax = Math.max(...zones.map((zone) => zone.max));
      const lowestMin = Math.min(...zones.map((zone) => zone.min));

      const docSnap = await firestore.
        collection("users").doc(uid).collection("heartRate")
        .doc(currentDate).get();

      const writeDoc = async (averageHR:number
        , highestHR:number, lowestHR:number) => {
        await firestore.collection("users").doc(uid).collection("heartRate")
          .doc(currentDate)
          .set({
            averageHR: averageHR,
            highestHR: highestHR,
            lowestHR: lowestHR,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
          });
      };
      if (!docSnap.exists) {
        // If it doesnt exist, make it
        await writeDoc(midpointOutOfRange, highestMax, lowestMin);
      } else if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
          // If it exists then check previous values and send alert if needed
          const lastLow = data.lowestHR;
          const lastHigh = data.highestHR;
          if (userData.heartAlerts) {
            const thresholds:number[] = userData.heartThresholds;
            if (lowestMin < lastLow) {
              if (lowestMin < thresholds[0]) {
                await sendAlerts(uid, userData.displayName,
                  "heartLow", thresholds[0], lowestMin);
              }
            }
            if (highestMax > lastHigh) {
              if (highestMax > thresholds[1]) {
                await sendAlerts(uid, userData.displayName,
                  "heartHigh", thresholds[1], highestMax);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
});
