import React, {useEffect} from 'react';
import {Avatar, Button, Card, Icon, IconButton, Text} from 'react-native-paper';
import {TouchableRipple} from 'react-native-paper';
import AvatarIcon from "react-native-paper/src/components/Avatar/AvatarIcon";
import {styled} from "nativewind";
import {useState} from "react";
import {auth, db} from "@/shared/firebase-config"
import {router} from "expo-router"
import {View} from "react-native";
import {getDoc} from "firebase/firestore";
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
}

export const DashboardComponent: React.FC<Props> = ({userID}) => {
  const [subtitle, setSubtitle] = useState("Last Updated: Never");
  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [steps, setSteps] = useState("N/A");
  const [hrLow, setHrLow] = useState("N/A");
  const [hrHigh, setHrHigh] = useState("N/A");
  const [avgHR, setAvgHR] = useState("N/A");
  const currentDate = new Date().toISOString().split("T")[0];

  const [name, setName] = useState("Loading");

  const handleCardPress = () => {
    setExpanded(!expanded);
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    let initials = ""
    for (const word of words) {
      initials += word[0].toUpperCase()
    }
    return initials;
  }

  const toggleFavorite = () => {
    setFavorite(!favorite);
  }

  useEffect(() => {
    const fetchData = async () => {
      const currentUserRef = doc(db, "users", userID)
      const userSnap = await getDoc(currentUserRef)
      if (userSnap.exists()) {
        setName(userSnap.data().displayName)
      } else {
        return;
      }

      const stepsRef = doc(db, "users", userID, "steps", currentDate);
      const stepsSnap = await getDoc(stepsRef)
      if(stepsSnap.exists()){
        setSteps(stepsSnap.data().value)
      }else{
        console.log("No steps found")
      }

      const heartRef = doc(db, "users", userID, "heartRate", currentDate);
      const heartSnap = await getDoc(heartRef)
      if(heartSnap.exists()){
        setAvgHR(heartSnap.data().averageHR)
        setHrLow(heartSnap.data().averageMin)
        setHrHigh(heartSnap.data().averageMax)
      }else{
        console.log("No heart rate found")
      }
    }
    fetchData()
  }, []);


  return (
    <TouchableRipple onPress={handleCardPress}>
      <StyledCard mode="elevated" className="mx-3 mb-5">
        <StyledView className="flex-row items-center">
          <StyledCardTitle title={name} subtitle={subtitle}
                           left={(props) =>
                             <Avatar.Text {...props} label={getInitials(name)}/>}
                           className="flex flex-1">
          </StyledCardTitle>
          <StyledIconButton className="" selected={favorite}
                            icon={favorite ? "star" : "star-outline"} onPress={toggleFavorite} animated={true}/>
        </StyledView>
        {expanded && <StyledCardContent className="">
            <StyledView className="flex-row items-center flex pb-2">
                <StyledIcon className="flex flex-1" source="heart-pulse" size={20}/>
                <StyledText className="flex flex-0 pl-3 w-[20%]">Low: {hrLow}</StyledText>
                <StyledText className="flex flex-0 pl-3 w-[20%]"> Average: {avgHR}</StyledText>
                <StyledText className="flex flex-0 pl-3 w-[20%]">High: {hrHigh}</StyledText>
            </StyledView>
            <StyledView className="flex-row items-center">
                <StyledIcon className="pr-3" source="shoe-print" size={20}/>
                <StyledText className="ml-3">{steps} Steps</StyledText>
            </StyledView>
        </StyledCardContent>}
      </StyledCard>
    </TouchableRipple>
  );
};
