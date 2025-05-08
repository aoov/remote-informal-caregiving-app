import {
  ActivityIndicator,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  Icon,
  Searchbar,
  Surface,
  Text
} from 'react-native-paper'
import {router, useRouter} from 'expo-router';
import {styled} from "nativewind";
import AvatarIcon from "react-native-paper/src/components/Avatar/AvatarIcon";
import {DashboardComponent} from '@/component/DashboardComponent'
import {RefreshControl, ScrollView, View} from "react-native";
import {use, useEffect, useState} from "react";
import {auth, db, functions} from "@/shared/firebase-config";
import {doc} from "@firebase/firestore";
import {getDoc, updateDoc} from "firebase/firestore";
import {useNavigation} from '@react-navigation/native';
import {useLocalSearchParams} from "expo-router";
import {httpsCallable} from "@firebase/functions";
import {Timestamp} from 'firebase/firestore'


const StyledSurface = styled(Surface)
const StyledScrollView = styled(ScrollView)
const StyledCard = styled(Card)
const StyledText = styled(Text)
const StyledView = styled(View)
const StyledIcon = styled(Icon)
const StyledChip = styled(Chip)
const StyledSearchbar = styled(Searchbar)
const StyledDivider = styled(Divider)
const StyledDashboardComponent = styled(DashboardComponent)
const StyledButton = styled(Button)

type PrivacyToggleFields = {
  heartRate: boolean;
  steps: boolean;
  email: boolean;
  address: boolean;
  phoneNumber: boolean;
  physicianInfo: boolean;
  medication: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [friendsList, setFriendsList] = useState<string[]>([])
  const currentDate = new Date().toISOString().split("T")[0];
  const [steps, setSteps] = useState("N/A");
  const [averageHeartRate, setAverageHeartRate] = useState("N/A");
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const {x} = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const [privacyToggles, setPrivacyToggles] = useState<PrivacyToggleFields>({
    heartRate: true,
    steps: true,
    email: true,
    phoneNumber: true,
    address: true,
    physicianInfo: true,
    medication: true
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
    physicianInfo: 'Show Physician Info',
    medication: 'Show Medication'
  };

  useEffect(() => {
    if(!loading){
      savePrivacySettings()
    }
  }, [privacyToggles]);

  const savePrivacySettings = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    const currentUserRef = doc(db, "users", currentUser.uid)
    await updateDoc(currentUserRef, {
      privacyToggles: {
        heartRate: privacyToggles.heartRate,
        steps: privacyToggles.steps,
        email: privacyToggles.email,
        address: privacyToggles.address,
        phoneNumber: privacyToggles.phoneNumber,
        physicianInfo: privacyToggles.physicianInfo,
        medication: privacyToggles.medication
      }
    })
  }

  const isWithinSeconds = (timestamp: Timestamp, seconds: number): boolean => {
    const now = Date.now(); // current time in ms
    const targetTime = timestamp.toMillis(); // Firestore timestamp to ms
    const difference = Math.abs(now - targetTime);
    return difference <= (1000 * seconds); //seconds in milliseconds
  }

  // Gets friends list
  const fetchData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    updateData(currentUser.uid)

    const currentUserRef = doc(db, "users", currentUser.uid)
    const userSnap = await getDoc(currentUserRef)
    console.log("Fetching friends list");
    if (userSnap.exists()) {
      const list = userSnap.data().friends || []
      console.log("Updating friends list data")
      list.forEach((friend: string) => {
        updateData(friend);
      });
      setFriendsList(list)

      console.log("Fetching privacy toggles");
      if (userSnap.data().privacyToggles){
         setPrivacyToggles(userSnap.data().privacyToggles)
      }
    } else {
      return;
    }
    const stepsRef = doc(db, "users", currentUser.uid, "steps", currentDate);
    const stepsSnap = await getDoc(stepsRef)
    if (stepsSnap.exists()) {
      setSteps(stepsSnap.data().value)
    } else {
      console.log("No steps found")
    }
    const heartRef = doc(db, "users", currentUser.uid, "heartRate", currentDate);
    const heartSnap = await getDoc(heartRef)
    if (heartSnap.exists()) {
      setAverageHeartRate(heartSnap.data().averageHR)
    } else {
      console.log("No heart rate found")
    }
    setLoading(false)
  }

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    if (x) {
      // @ts-ignore
      navigation.navigate("Profile")
    }
    fetchData()

  }, []);

  const refresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }

  // Calls steps and heart data updater
  const updateData = (requested: string) => {
    setTimeout(async () => {
      if (!auth.currentUser) {
        return;
      }
      const userRef = doc(db, "users", requested);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return;
      }
      const requester = auth.currentUser.uid;
      const lastQuery = userSnap.data().lastQuery
      if ((lastQuery && isWithinSeconds(lastQuery, 60))) {
        return;
      }
      try {
        const updateSteps = httpsCallable(functions, "updateSteps");
        await updateSteps({
          requester: requester,
          userID: requested,
        })
        console.log("updateSteps called for " + requested + " by " + requester);
        const updateHeart = httpsCallable(functions, "updateHeart");
        await updateHeart({
          requester: requester,
          userID: requested,
        })
        console.log("updateHeart called for " + requested + " by " + requester);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/');
          return;
        }
        const userRef = doc(db, "users", requested);
        await updateDoc(userRef, {lastQuery: Timestamp.now()});
      } catch (error) {
        console.error(error);
      }
    }, 2000);
  };


  // @ts-ignore
  return (
    <StyledSurface className="flex flex-1 justify-center align-middle h-[120%] pt-3">
      <StyledSearchbar className="mb-3" elevation={2} value={""}></StyledSearchbar>
      <StyledScrollView className="" overScrollMode="always" bouncesZoom={true} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh}/>
      }>
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
                avatar={privacyToggles[field] && <Icon size={20} source="check-bold" color="green"/>}
                onPress={() => togglePrivacy(field)}
                showSelectedCheck={false}
              >
                {toggleLabels[field]}
              </StyledChip>
            ))}
          </StyledView>
        </StyledCard>
        <StyledButton className="justify-center flex-1 p-2 mx-2 my-1" mode="contained"
                      onPress={() => router.push("/modals/add")}
        >Add Friends</StyledButton>
        <StyledButton className="justify-center flex-1 p-2 mx-2 my-1" mode="contained"
                      onPress={() => {
                        router.push({
                          pathname: "/modals/expandedProfile",
                          params: { x: "lWoYiOEtzhSeTASgYkcPQp4d5za2" },
                        });
                      }}
        >test</StyledButton>
        <StyledView className="mb-2 pt-2">
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            friendsList.map((friend: string, i) => (
              <StyledDashboardComponent className="" userID={friend} key={i} />
            ))
          )}
        </StyledView>
        <StyledSurface className="my-5 h-[300] bg-transparent">
          <StyledView></StyledView>
        </StyledSurface>
      </StyledScrollView>
    </StyledSurface>
  );
}
