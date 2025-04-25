import React, {useEffect} from 'react';
import {Avatar, Button, Card, Dialog, Icon, IconButton, Menu, Portal, Text, useTheme} from 'react-native-paper';
import {TouchableRipple} from 'react-native-paper';
import {styled} from "nativewind";
import {useState} from "react";
import {auth, db} from "@/shared/firebase-config"
import {router} from "expo-router"
import {Linking, View} from "react-native";
import {collection, getDoc, getDocs, Timestamp, updateDoc} from "firebase/firestore";
import {doc} from "@firebase/firestore";

const StyledButton = styled(Button)
const StyledCardTitle = styled(Card.Title)
const StyledCard = styled(Card)
const StyledCardContent = styled(Card.Content)
const StyledText = styled(Text)
const StyledView = styled(View)
const StyledIconButton = styled(IconButton)
const StyledIcon = styled(Icon)

interface Props {
  userID: string;
  name: string;
  alertID: string;
  type: string;
  date: Timestamp;
  threshold: number;
  observed: number;
  read: boolean;
}

export const AlertComponent: React.FC<Props> = ({userID, read, name, alertID, type, date, observed, threshold}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const theme = useTheme();
  const [backgroundColor, setBackgroundColor] = useState(theme.colors.elevation.level1);
  const [isRead, setIsRead] = useState(read);
  const [invalidNumber, setInvalidNumber] = useState(false);

  const setRead = async (val: boolean) => {
    setIsRead(val)
    //Save state
    try {
      if (!auth.currentUser) {
        return;
      }
      const docRef = doc(db, "users", auth.currentUser.uid, "alerts", alertID)
      await updateDoc(docRef, {
        read: val
      });

    } catch (error) {
      console.error("Error writing document: ", error);
    }
  }
  const hideDialog = () => {
    setInvalidNumber(false)
  }
  const showDialog = () => {
    setInvalidNumber(true)
  }

  const phoneCall = async (phone?:string) => {
    if(phone){
      await Linking.openURL('telprompt:' + phone)
      return;
    }
    try {
      const docRef = doc(db, "users", userID)
      const docSnap = await getDoc(docRef);
      let number:string = ""
      if (docSnap.exists()) {
        number = docSnap.data().phone
      }
      if(number.length == 0){
        await Linking.openURL('telprompt:' + number)
      }else{
        showDialog()
      }
    } catch (error) {
      console.error("Error getting number: ", error);
    }
  }
  const markRead = async (val: boolean) => {
    setIsRead(val)
    try {
      if (!auth.currentUser) {
        return;
      }
      const docRef = doc(db, "users", auth.currentUser.uid, "alerts", alertID)
      await updateDoc(docRef, {
        read: val
      });

    } catch (error) {
      console.error("Error writing document: ", error);
    }
  }

  const handleCardPress = () => {
    if (!expanded) { //If it was not expanded, mark read
      setRead(true);
    }
    setExpanded(!expanded);
  };

  const convertDate = () => {
    const dateObj = new Date(
      date.seconds * 1000 + date.nanoseconds / 1000000)

    return dateObj.toLocaleString('en-US', {
      weekday: "short",
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const getIcon = () => {
    if (type.includes("heart")) {
      return <StyledIcon size={32} source="heart-pulse" color="red"/>
    }
    if (type.includes("steps")) {
      return <StyledIcon size={32} source="walk" color="blue"/>
    }
    if (type.includes("activity")) {
      return <StyledIcon size={32} source="sync-alert" color="green"/>
    }
    return <StyledIcon size={32} source="cards-heart"/>
  }

  const getTitle = () => {
    let ret = name + " - "
    switch (type) {
      case 'heartHigh':
        ret = ret + "High Heart Rate"
        break;
      case 'heartLow':
        ret = ret + "Low Heart Rate"
        break;
      case "stepsHigh":
        ret = ret + "High Step Count"
        break;
      case "stepsLow":
        ret = ret + "Low Step Count"
        break;
      case "activity":
        ret = ret + "No Activity"
        break;
      default:
        ret = ret + "Error"
        break;
    }
    return ret
  }

  const getCardText = () => {
    switch (type) {
      case 'heartHigh':
        return "Heart Rate Detected Over Threshold"
      case 'heartLow':
        return "Heart Rate Detected Under Threshold"
      case "stepsHigh":
        return "Step Count Exceeded Threshold"
      case "stepsLow":
        return "Step Count Below Threshold"
      case "activity":
        return "No Activity Detected Over Threshold"
      default:
        return "Error"
    }
  }
  return (
    <TouchableRipple onPress={handleCardPress}>
      <StyledCard mode="elevated" className="mx-3 mb-5"
                  style={{
                    backgroundColor: (isRead && !expanded) ? theme.colors.outline : theme.colors.elevation.level1
                  }}>
        <Portal>
          <Dialog visible={invalidNumber} onDismiss={hideDialog}>
            <Dialog.Title>Alert</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Recipient does not have a valid phone number. Please call them outside of the app</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Done</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <StyledView className="flex-row items-center">
          <StyledCardTitle title={getTitle()} subtitle={convertDate()}
                           left={(props) =>
                             getIcon()}
                           className="flex flex-1">
          </StyledCardTitle>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <StyledIconButton
                icon="dots-vertical"
                animated={true}
                onPress={openMenu}
              />
            }>
            <Menu.Item onPress={() => {
              markRead(true)
            }} title="Mark as read"/>
            <Menu.Item onPress={() => {
              markRead(false)
            }} title="Mark unread"/>
            <Menu.Item onPress={() => {
            }} title="Delete"/>
          </Menu>
        </StyledView>
        {expanded && <StyledCardContent className="">
            <StyledView className="flex gap-y-1.5 mb-3">
                <StyledText className="text-" variant="titleMedium">{getCardText()}</StyledText>
                <StyledText className="text-">{"Observed: " + observed}</StyledText>
                <StyledText className="text-">{"Threshold: " + threshold}</StyledText>
            </StyledView>
            <StyledView className="flex-row items-center justify-between flex pb-1">
                <StyledButton mode="contained" icon="message">Message</StyledButton>
                <StyledButton mode="contained" onPress={() =>{
                  phoneCall()
                }} icon="phone" buttonColor="green">Call</StyledButton>
                <StyledButton mode="contained" onPress={() => {
                  phoneCall("911")
                }} icon="alert-circle" buttonColor="red">EMS</StyledButton>
            </StyledView>
        </StyledCardContent>}
      </StyledCard>
    </TouchableRipple>
  );
};
