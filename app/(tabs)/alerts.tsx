import React, {useEffect} from 'react';
import {Avatar, Button, Card, Divider, Icon, IconButton, Surface, Text} from 'react-native-paper';
import {TouchableRipple} from 'react-native-paper';
import {styled} from "nativewind";
import {useState} from "react";
import {auth, db} from "@/shared/firebase-config"
import {router} from "expo-router"
import {ScrollView, View} from "react-native";
import {collection, getDoc, getDocs, Timestamp} from "firebase/firestore";
import {doc} from "@firebase/firestore";
import {AlertComponent} from "@/component/AlertComponent";

const StyledSurface = styled(Surface)
const StyledButton = styled(Button)
const StyledCardTitle = styled(Card.Title)
const StyledCard = styled(Card)
const StyledCardContent = styled(Card.Content)
const StyledText = styled(Text)
const StyledView = styled(View)
const StyledIconButton = styled(IconButton)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledDivider = styled(Divider)

interface Alert {
  userID: string;
  name: string;
  alertID: string;
  type: string;
  date: Timestamp;
  threshold: number;
  observed: number;
  read: boolean;
}

interface CategorizedAlerts {
  today: Alert[];
  yesterday: Alert[];
  older: Alert[];
}

export default function Index() {
  const [alertsList, setAlertsList] = useState<Alert[]>([])
  const [categorizedAlerts, setCategorizedAlerts] = useState<CategorizedAlerts>({
    today: [],
    yesterday: [],
    older: []
  });

  const getAlerts = async () => {
    try {
      if (!auth.currentUser) {
        setAlertsList([]);
        setCategorizedAlerts({today: [], yesterday: [], older: []});
        return;
      }

      const querySnap = await getDocs(collection(db, "users/", auth.currentUser.uid, "alerts"));
      const alerts = querySnap.docs.map(doc => ({
        userID: doc.data().userID || '',
        name: doc.data().name || '',
        alertID: doc.id,
        type: doc.data().type || 'unknown',
        date: doc.data().date,
        threshold: Number(doc.data().threshold) || 0,
        observed: Number(doc.data().observed) || 0,
        read: doc.data().read === true
      }));

      // Sort by newest
      alerts.sort((a, b) => b.date.toMillis() - a.date.toMillis());

      // Categorize the alerts
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const categorized: CategorizedAlerts = {
        today: [],
        yesterday: [],
        older: [],
      };

      alerts.forEach(alert => {
        const alertDate = alert.date.toDate();
        const alertDay = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate());

        if (alertDay.getTime() === today.getTime()) {
          categorized.today.push(alert);
        } else if (alertDay.getTime() === yesterday.getTime()) {
          categorized.yesterday.push(alert);
        } else {
          categorized.older.push(alert);
        }
      });
      setAlertsList(alerts); // Keep original array if needed
      setCategorizedAlerts(categorized); // Store categorized version

    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlertsList([]);
      setCategorizedAlerts({today: [], yesterday: [], older: []});
    }
  }

  useEffect(() => {
    getAlerts();
  }, []);

  return (
    <StyledSurface className="flex flex-1 justify-center align-middle h-[90%] pt-3">
      <StyledScrollView className="h-[100%]" overScrollMode="always" bouncesZoom={true}>
        {categorizedAlerts.today.length == 0
          && categorizedAlerts.yesterday.length == 0
          && categorizedAlerts.older.length == 0 && (
            <StyledView className=" h-[80%] text-center justify-center items-center p-10">
              <StyledText variant="displayLarge">No Alerts Found</StyledText>
            </StyledView>)}

        {categorizedAlerts.today.length > 0 && (
          <StyledView className="px-3">
            <StyledText variant="headlineLarge">Today</StyledText>
            <StyledDivider className="mb-3 mt-1" bold={true}/>
            {categorizedAlerts.today.map((alert) => (
              <AlertComponent
                key={alert.alertID}
                name={alert.name}
                userID={alert.userID}
                alertID={alert.alertID}
                type={alert.type}
                date={alert.date}
                threshold={alert.threshold}
                observed={alert.observed}
                read={alert.read}
              />
            ))}
          </StyledView>)}
        {categorizedAlerts.yesterday.length > 0 && (
          <StyledView className="px-3">
            <StyledText variant="headlineMedium">Yesterday</StyledText>
            <StyledDivider className="mb-3 mt-1" bold={true}/>
            {categorizedAlerts.yesterday.map((alert) => (
              <AlertComponent
                key={alert.alertID}
                name={alert.name}
                userID={alert.userID}
                alertID={alert.alertID}
                type={alert.type}
                date={alert.date}
                threshold={alert.threshold}
                observed={alert.observed}
                read={alert.read}
              />
            ))}
          </StyledView>)}
        {categorizedAlerts.older.length > 0 && (
          <StyledView className="px-3">
            <StyledText variant="headlineMedium">Older</StyledText>
            <StyledDivider className="mb-3 mt-1" bold={true}/>
            {categorizedAlerts.older.map((alert) => (
              <StyledView className="mb-2" key={alert.alertID}>
                <AlertComponent
                  name={alert.name}
                  userID={alert.userID}
                  alertID={alert.alertID}
                  type={alert.type}
                  date={alert.date}
                  threshold={alert.threshold}
                  observed={alert.observed}
                  read={alert.read}
                />
              </StyledView>
            ))}
          </StyledView>)}
        <StyledSurface className="my-5 h-[200] bg-transparent">
          <StyledView></StyledView>
        </StyledSurface>
      </StyledScrollView>
    </StyledSurface>
  );
}