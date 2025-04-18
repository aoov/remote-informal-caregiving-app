import {Button, Card, Checkbox, Chip, Divider, Icon, Searchbar, Surface, Text} from 'react-native-paper'
import {router, useRouter} from 'expo-router';
import {styled} from "nativewind";
import AvatarIcon from "react-native-paper/src/components/Avatar/AvatarIcon";
import {DashboardComponent} from '@/component/DashboardComponent'
import {RefreshControl, ScrollView, View} from "react-native";
import {useEffect, useState} from "react";
import {auth, db} from "@/shared/firebase-config";
import {doc} from "@firebase/firestore";
import {getDoc} from "firebase/firestore";

const StyledSurface = styled(Surface)
const StyledScrollView = styled(ScrollView)
const StyledCard = styled(Card)
const StyledText = styled(Text)
const StyledView = styled(View)
const StyledIcon = styled(Icon)
const StyledChip = styled(Chip)
const StyledSearchbar = styled(Searchbar)
const StyledDivider = styled(Divider)

type PrivacyToggleFields = {
  heartRate: boolean;
  steps: boolean;
  email: boolean;
  address: boolean;
  phoneNumber: boolean;
  physicianInfo: boolean;
};


export default function Dashboard() {
  const router = useRouter();
  const [friendsList, setFriendsList] = useState<string[]>([])
  const currentDate = new Date().toISOString().split("T")[0];
  const [steps, setSteps] = useState("N/A");
  const [averageHeartRate, setAverageHeartRate] = useState("N/A");
  const [refreshing, setRefreshing] = useState(false);

  const [privacyToggles, setPrivacyToggles] = useState<PrivacyToggleFields>({
    heartRate: true,
    steps: true,
    email: true,
    phoneNumber: true,
    address: true,
    physicianInfo: true
  });
  const togglePrivacy = (field: keyof PrivacyToggleFields) => {
    setPrivacyToggles(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const toggleLabels: Record<keyof PrivacyToggleFields, string> = {
    heartRate: 'Show Heart Rate',
    steps: 'Show Steps',
    email: 'Show Email',
    address: 'Show Address',
    phoneNumber: 'Show Phone Number',
    physicianInfo: 'Show Physician Info'
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    const fetchData = async () => {
      const currentUserRef = doc(db, "users", currentUser.uid)
      const userSnap = await getDoc(currentUserRef)
      if (userSnap.exists()){
        const list = userSnap.data().friends || []
        setFriendsList(list)
      }
      else{
        return;
      }
      const stepsRef = doc(db, "users", currentUser.uid, "steps", currentDate);
      const stepsSnap = await getDoc(stepsRef)
      if(stepsSnap.exists()){
        setSteps(stepsSnap.data().value)
      }else{
        console.log("No steps found")
      }

      const heartRef = doc(db, "users", currentUser.uid, "heartRate", currentDate);
      const heartSnap = await getDoc(heartRef)
      if(heartSnap.exists()){
        setAverageHeartRate(heartSnap.data().averageHR)
      }else{
        console.log("No heart rate found")
      }
    }
    fetchData()
  }, []);


  return (
    <StyledSurface className="flex flex-1 justify-center align-middle h-[90%] pt-3">
      <StyledSearchbar className="mb-3" elevation={2} value={""}></StyledSearchbar>
      <StyledScrollView className="" overScrollMode="always" bouncesZoom={true}>
        <RefreshControl refreshing={refreshing}/>
        <StyledCard className="flex flex-1 p-2 mx-2 my-3">
          <StyledText className="flex-1 text-center" variant="headlineMedium">Personal Info</StyledText>
          <StyledView className="flex flex-row mb-1">
            <StyledText className="text-center flex-1" variant="titleLarge">{averageHeartRate} BPM</StyledText>
            <StyledText className="text-center pr-5 flex-1" variant="titleLarge">{steps}</StyledText>
          </StyledView>
          <StyledView className="flex flex-row ml-2">
            <StyledIcon className="" source="heart-pulse" size={30}/>
            <StyledText className="pl-3 flex-1" variant="titleLarge">Heart Rate Average</StyledText>
            <StyledIcon source="shoe-print" size={30}/>
            <StyledText className="pl-3 flex-1" variant="titleLarge">Steps</StyledText>
          </StyledView>
          <StyledDivider className="my-2"/>
          <StyledText className="ml-1 mb-1" variant="titleLarge">Privacy Controls</StyledText>
          <StyledView className="flex-wrap flex-row gap-2 pb-2">
            {(Object.keys(privacyToggles) as Array<keyof PrivacyToggleFields>).map((field) => (
              <StyledChip
                key={field}
                selected={privacyToggles[field]}
                showSelectedOverlay={privacyToggles[field]}
                onPress={() => togglePrivacy(field)}
              >
                {toggleLabels[field]}
              </StyledChip>
            ))}
          </StyledView>
        </StyledCard>
        {friendsList.map((friend: string, i) => (
          <DashboardComponent userID={friend} key={i}/>
        ))}
        <StyledSurface className="my-5 h-[300] bg-transparent">
          <StyledView></StyledView>
        </StyledSurface>
      </StyledScrollView>
    </StyledSurface>
  );
}
