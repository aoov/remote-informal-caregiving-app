import {Button, Card, Checkbox, Chip, Divider, Icon, Searchbar, Surface, Text} from 'react-native-paper'
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

  const isWithin30Seconds = (timestamp: Timestamp): boolean => {
    const now = Date.now(); // current time in ms
    const targetTime = timestamp.toMillis(); // Firestore timestamp to ms
    const difference = Math.abs(now - targetTime);
    return difference <= 30 * 1000; // 30 seconds in milliseconds
  }

  const updateDataFor = async (target: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    const userRef = doc(db, "users", target)
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return;
    }
    const lastQuery = userSnap.data().lastQuery
    if (lastQuery && !isWithin30Seconds(lastQuery)) {
      console.log("Updating data for " + target);
      updateData(currentUser.uid, target)
    }
  }

  // Gets friends list
  const fetchData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/')
      return;
    }
    console.log("Updating data for self");
    updateDataFor(currentUser.uid)
    const currentUserRef = doc(db, "users", currentUser.uid)
    const userSnap = await getDoc(currentUserRef)
    console.log("Fetching friends list");
    if (userSnap.exists()) {
      const list = userSnap.data().friends || []
      console.log("Updating friends list data")
      list.forEach((friend: string) => {
        updateDataFor(friend);
      });

      setFriendsList(list)
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
    fetchData()
  }

  // Calls steps and heart data updater
  const updateData = (requester: string, requested: string) => {
    setRefreshing(true);
    setTimeout(async () => {
      if (!auth.currentUser) {
        setRefreshing(false);
        return;
      }
      try {
        const updateSteps = httpsCallable(functions, "updateSteps");
        await updateSteps({
          requester: requester,
          userID: requested,
        })
        console.log("updateSteps called");

        const updateHeart = httpsCallable(functions, "updateHeart");
        await updateHeart({
          requester: requester,
          userID: requested,
        })
        console.log("updateHeart called");

        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/');
          return;
        }
        const userRef = doc(db, "users", requested);
        await updateDoc(userRef, { lastQuery: Timestamp.now() });
      } catch (error) {
        console.error(error);
      } finally {
        setRefreshing(false);
      }
    }, 2000);
  };


  // @ts-ignore
  return (
    <StyledSurface className="flex flex-1 justify-center align-middle h-[120%] pt-3">
      <StyledSearchbar className="mb-3" elevation={2} value={""}></StyledSearchbar>
      <StyledScrollView className="" overScrollMode="always" bouncesZoom={true}>
        <RefreshControl refreshing={refreshing} onRefresh={refresh}/>
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

        <StyledButton className="justify-center flex-1 p-2 mx-2 my-1" mode="contained"
                      onPress={() => router.push("/modals/add")}
        >Add Friends</StyledButton>

        <StyledView className="mb-2 pt-2">
          {friendsList.map((friend: string, i) => (
            <StyledDashboardComponent className="" userID={friend} key={i}/>
          ))}
        </StyledView>
        <StyledSurface className="my-5 h-[300] bg-transparent">
          <StyledView></StyledView>
        </StyledSurface>
      </StyledScrollView>
    </StyledSurface>
  );
}
