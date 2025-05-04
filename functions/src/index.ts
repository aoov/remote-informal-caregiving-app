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

    logger.info("Received update steps from " +
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

    interface HeartRateZone {
      caloriesOut: number;
      max: number;
      min: number;
      minutes: number;
      name: string;
    }

    if (response.status === 200) {
      const heartData = response.data["activities-heart"][0];
      const zones: HeartRateZone[] = heartData.value.heartRateZones;

      // 1. Get Resting Heart Rate (if available)
      const restingHR = heartData.value.restingHeartRate || null;

      // 2. Calculate Time in Each Zone
      const zoneSummary = zones.map((zone) => ({
        name: zone.name,
        minutes: zone.minutes,
        calorieBurn: zone.caloriesOut,
        range: `${zone.min}-${zone.max} bpm`,
      }));

      // 3. Calculate Weighted Average Heart Rate
      const {
        totalMinutes,
        totalWeightedHR,
        totalWeightedMin,
        totalWeightedMax,
      } = zones.reduce(
        (acc, zone) => {
          const zoneAvg = (zone.min + zone.max) / 2;
          return {
            totalMinutes: acc.totalMinutes + zone.minutes,
            totalWeightedHR: acc.totalWeightedHR + zoneAvg * zone.minutes,
            totalWeightedMin: acc.totalWeightedMin + zone.min * zone.minutes,
            totalWeightedMax: acc.totalWeightedMax + zone.max * zone.minutes,
          };
        },
        {
          totalMinutes: 0,
          totalWeightedHR: 0,
          totalWeightedMin: 0,
          totalWeightedMax: 0, // Initial value
        }
      );

      const avgHR = totalMinutes > 0 ?
        Math.round(totalWeightedHR / totalMinutes) :
        null;

      const weightedMinAverage = totalMinutes > 0 ?
        totalWeightedMin / totalMinutes : null;
      const weightedMaxAverage = totalMinutes > 0 ?
        totalWeightedMax / totalMinutes : null;

      await firestore.collection("users").doc(uid).collection("heartRate")
        .doc(currentDate)
        .set({
          restingHR: restingHR,
          averageHR: avgHR,
          averageMin: weightedMinAverage,
          averageMax: weightedMaxAverage,
          zones: zoneSummary,
          totalActiveMinutes: zones.reduce((sum, zone) =>
            sum + (zone.name !== "Out of Range" ? zone.minutes : 0), 0),
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  } catch (error) {
    logger.error(error);
  }
});
