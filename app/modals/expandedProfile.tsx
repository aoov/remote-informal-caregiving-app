import {styled} from 'nativewind'
import {
  ActivityIndicator,
  Button, Divider, HelperText,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";
import {auth, db, functions} from '@/shared/firebase-config'
import {collection, getDoc, getDocs, where, query, Timestamp, DocumentSnapshot} from 'firebase/firestore';
import {router, useLocalSearchParams} from "expo-router";
import {Modal, SafeAreaView, ScrollView, View} from "react-native";
import {httpsCallable} from "@firebase/functions";
import {useEffect, useState} from "react";
import {doc, setDoc} from "@firebase/firestore";
import * as Localization from "expo-localization";
import { DateTime } from "luxon"
import MultiSlider from "@ptomasroos/react-native-multi-slider";


const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledSwitch = styled(Switch)
const StyledButton = styled(Button)
const StyledIconButton = styled(IconButton)
const StyledDivider = styled(Divider)
const StyledMultiSlider = styled(MultiSlider)


export default function AddingPage() {
  const {x} = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [userID, setUserID] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("N/A");
  const [address, setAddress] = useState<string>("N/A");
  const [phone, setPhone] = useState<string>("N/A");
  const [physicianName, setPhysicianName] = useState<string>("N/A");
  const [physicianNumber, setPhysicianNumber] = useState<string>("N/A");
  const [heartAlerts, setHeartAlerts] = useState<boolean>(false);
  const [stepsAlerts, setStepsAlerts] = useState<boolean>(false);
  const [activityAlerts, setActivityAlerts] = useState<boolean>(false);
  const [stepThresholds, setStepThresholds] = useState<number[]>([]);
  const [heartThresholds, setHeartThresholds] = useState<number[]>([]);
  const [activityThreshold, setActivityThreshold] = useState<number[]>([]);

  const [timezone, setTimezone] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>();
  const theme = useTheme();

  //TODO Enable Overrides
  const fetchData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser && typeof userID == 'string') {
      router.push('/')
      return;
    }

    const currentUserRef = doc(db, "users", userID)
    const userSnap = (await getDoc(currentUserRef).finally(()=> {}))
    if (!userSnap?.exists()){
      console.error("Could not get user snapshot in expanded profile: " + userID)
      router.push('/dashboard')
      return;
    }
    const privacyToggles = userSnap?.data().privacyToggles
    setDisplayName(userSnap?.data().displayName)
    setEmail(userSnap?.data().email)
    setPhone(userSnap?.data().phone)
    setAddress(userSnap?.data().address)
    setPhysicianName(userSnap?.data().physicianName)
    setPhysicianNumber(userSnap?.data().physicianNumber)
    setCurrentTime(getCurrentTime(userSnap?.data().timezone))
    setStepsAlerts(userSnap?.data().stepsAlerts)
    setActivityAlerts(userSnap?.data().activityAlerts)
    setHeartAlerts(userSnap?.data().heartAlerts)
    setHeartAlerts(userSnap?.data().heartAlerts)
    setStepsAlerts(userSnap?.data().stepAlerts)
    setActivityAlerts(userSnap?.data().activityAlerts)
    setStepThresholds(userSnap?.data().stepThresholds)
    setHeartThresholds(userSnap?.data().heartThresholds)
    setActivityThreshold(userSnap?.data().activityThreshold)

  }

  const getCurrentTime = (timezone:string | undefined):string => {
    const currentTimeInZone = DateTime.now().setZone(timezone);
    return currentTimeInZone.toFormat('hh:mm a')
  }

  useEffect(() => {
    if (x && typeof x === "string") {
      setUserID(x)
    }else {
      router.push("/dashboard")
    }

    setLoading(false)
  }, []);

  useEffect(() => {
    fetchData()
  }, [userID]);

  return (
    <Modal animationType="slide">
      <SafeAreaView style={{flex: 1}}>
        <StyledSurface className="flex h-[100%]">
          <StyledScrollView className="flex flex-grow" style={{backgroundColor: theme.colors.surfaceVariant}}>
            <StyledButton className="justify-center flex-1 p-2 mx-2 my-1" mode="contained"
                          onPress={() => router.push("/dashboard")}
            >Close</StyledButton>
            <StyledTextInput mode="flat" label="Current Time: " value={currentTime} editable={false}/>
            <StyledTextInput mode="flat" label="Full Name" value={displayName} editable={false}/>
            <StyledTextInput mode="flat" label="Address" value={address} editable={false}/>
            <StyledTextInput mode="flat" label="Phone Number" value={phone} editable={false}/>
            <StyledTextInput mode="flat" label="Email Address" value={email} editable={false}/>
            <StyledTextInput mode="flat" label="Physician Name" value={physicianName}
                             editable={false}/>
            <StyledTextInput mode="flat" label="Physician Number" value={physicianNumber}
                             editable={false}/>
            <StyledSurface elevation={0} mode="flat"
                           className="flex flex-row items-center justify-between flex-grow py-5">
              <StyledText
                className="px-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                Enable Alert Overrides
              </StyledText>
              <StyledSwitch
                className="mr-1"
                value={heartAlerts}
              />

            </StyledSurface>

            <StyledDivider bold={true} className=""/>
            {/* Heartbeat Alerts */}
            <StyledSurface elevation={0} mode="flat"
                           className="flex flex-row items-center justify-between flex-grow pt-2">
              <StyledText
                className="px-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                Heartbeat Alerts: {heartThresholds[0] + " BPM - " + heartThresholds[1] + " BPM"}
              </StyledText>
              <StyledSwitch
                className="mr-1"
                value={heartAlerts}
              />
            </StyledSurface>
            <StyledSurface elevation={0} mode="flat" className="flex flex-grow flex-row justify-between">
              <StyledText
                className="ml-3 mt-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                20
              </StyledText>
              <StyledMultiSlider
                values={heartThresholds}
                enabledTwo={true}
                min={20}
                max={200}

              />
              <StyledText
                className="mr-3 mt-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                200
              </StyledText>
            </StyledSurface>
            {/* Heartbeat Alerts End */}
            {/* Steps Alerts */}
            <StyledSurface elevation={0} mode="flat"
                           className="flex flex-row items-center justify-between flex-grow pt-2">
              <StyledText
                className="px-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                Steps Alerts: {stepThresholds[0] + " steps - " + stepThresholds[1] + " steps"}
              </StyledText>
              <StyledSwitch
                className="mr-1"
                value={stepsAlerts}
              />
            </StyledSurface>
            <StyledSurface elevation={0} mode="flat" className="flex flex-grow flex-row justify-between">
              <StyledText
                className="ml-3 mt-3 pr-5"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                0
              </StyledText>
              <StyledMultiSlider
                values={stepThresholds}
                enabledTwo={true}
                step={250}
                min={0}
                max={20000}
              />
              <StyledText
                className="mr-3 mt-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                20,000
              </StyledText>
            </StyledSurface>
            {/* Steps Alerts End */}
            {/* No Activity Alerts */}
            <StyledSurface elevation={0} mode="flat"
                           className="flex flex-row items-center justify-between flex-grow pt-2">
              <StyledText
                className="px-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                No Activity Alerts: {activityThreshold[0] + " days"}
              </StyledText>
              <StyledSwitch
                className="mr-1"
                value={activityAlerts}
              />
            </StyledSurface>
            <StyledSurface elevation={0} mode="flat" className="flex flex-grow flex-row ">
              <StyledText
                className="ml-3 mt-3 mr-7"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                Days
              </StyledText>
              <StyledMultiSlider
                min={1}
                max={30}
                values={activityThreshold}
              />
            </StyledSurface>
            <StyledDivider bold={true} className=""/>
            <StyledSurface elevation={0} mode="flat"
                           className="flex justify-between flex-grow py-5">
              <StyledText
                className="px-3"
                variant="titleMedium"
                style={{color: theme.colors.onTertiaryContainer}}
              >
                Medications:
              </StyledText>
            </StyledSurface>

            <StyledDivider bold={true} className=""/>

            <StyledSurface className="my-5 h-[200] bg-transparent">
              <View></View>
            </StyledSurface>
            {/* Steps Alerts End */}
          </StyledScrollView>
        </StyledSurface>
      </SafeAreaView>
    </Modal>
  );
}