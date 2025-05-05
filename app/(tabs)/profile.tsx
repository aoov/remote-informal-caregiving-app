import {ScrollView, View} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";
import {styled} from 'nativewind'
import * as Localization from 'expo-localization'
import {useEffect, useState} from "react";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import {auth, db} from '@/shared/firebase-config'
import {getDoc, updateDoc} from 'firebase/firestore';
import {Link, router} from "expo-router";
import {doc, setDoc} from "@firebase/firestore";
import * as WebBrowser from 'expo-web-browser'

const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledMultiSlider = styled(MultiSlider)
const StyledSwitch = styled(Switch)
const StyledButton = styled(Button)
const StyledIconButton = styled(IconButton)

export default function Index() {
  const theme = useTheme();
  const [timezone, setTimezone] = useState("");
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [physicianName, setPhysicianName] = useState('');
  const [physicianNumber, setPhysicianNumber] = useState('');
  const [name, setName] = useState('');
  const [enableHeartbeatAlert, setEnableHeartbeatAlert] = useState(false);
  const [heartbeatUpperThreshold, setHeartbeatUpperThreshold] = useState(100);
  const [heartbeatLowerThreshold, setHeartbeatLowerThreshold] = useState(60);
  const [enableStepsAlert, setEnableStepsAlert] = useState(false);
  const [stepsUpperThreshold, setStepsUpperThreshold] = useState(10000);
  const [stepsLowerThreshold, setStepsLowerThreshold] = useState(500);
  const [enableNoActivityAlert, setEnableNoActivityAlert] = useState(false);
  const [noActivityUpperThreshold, setNoActivityUpperThreshold] = useState(0);
  const [showHeartbeatMarker, setShowHeartbeatMarker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [fitbitLink, setFitbitLink] = useState('');
  const [hasFitbitLinked, setHasFitbitLinked] = useState(false);


  const saveData = async () => {
    if (loading) {
      return;
    }
    const currentUser = auth.currentUser
    if (!currentUser) {
      router.push('/')
      setLoading(false)
      return;
    }
    const userID = currentUser.uid
    const userRef = doc(db, "users", userID)
    try {
      await updateDoc(userRef, {
        address: address,
        displayName: name,
        email: email,
        phone: phone,
        physicianName: physicianName,
        physicianNumber: physicianNumber,
        heartAlerts: enableHeartbeatAlert,
        activityAlerts: enableNoActivityAlert,
        stepAlerts: enableStepsAlert,
        heartThresholds: [heartbeatLowerThreshold, heartbeatUpperThreshold],
        stepThresholds: [stepsLowerThreshold, stepsUpperThreshold],
        activityThreshold: [noActivityUpperThreshold]
      })
    } catch (err) {
      console.error(err)
    }
  }


  //Handles data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          router.push('/')
          setLoading(false)
          return;
        }
        const userID = currentUser.uid
        const userRef = doc(db, "users", userID)
        const userSnap = await getDoc(userRef)
        //Set fitbit link
        // TODO make true PKCE code and verifier
        const codeVerifier = "1k0v2q5t3r0i0h3s462t2l1w4d461x4n260t0v4s6w344i0w3g056y5g1k3b651h2z3n1g5x550w5n5q3j5p171d6v36726w1o3b0s5d4q3g070o5p5l203a4v6y5h0h"
        const codeChallenge = "ziYe-mHJvMVOCEkgyoy5v9T76GyMKY0hqMkQGvophyY"

        await setDoc(doc(db, "OAuth", userID), {
          codeVerifier,
        })

        setFitbitLink("https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=23Q4VW&scope=activity+cardio_fitness+electrocardiogram+heartrate" +
          "+irregular_rhythm_notifications+location+nutrition+oxygen_saturation+profile+respiratory_rate+settings+sleep+social+temperature" +
          "+weight&code_challenge=" + codeChallenge +
          "&code_challenge_method=S256&" +
          "state=" + userID + //Attach userID to state value
          "&redirect_uri=https%3A%2F%2Fus-central1-rica-68448.cloudfunctions.net%2FfitbitCallback")
        if (userSnap.exists()) {
          setName(userSnap.data().displayName)
          setAddress(userSnap.data().address)
          setPhone(userSnap.data().phone)
          setPhysicianName(userSnap.data().physicianName)
          setPhysicianNumber(userSnap.data().physicianNumber)
          setStepsLowerThreshold(userSnap.data().stepThresholds[0])
          setStepsUpperThreshold(userSnap.data().stepThresholds[1])
          setHeartbeatUpperThreshold(userSnap.data().heartThresholds[1])
          setHeartbeatLowerThreshold(userSnap.data().heartThresholds[0])
          setNoActivityUpperThreshold(userSnap.data().activityThreshold[0])
          setEnableNoActivityAlert(userSnap.data().activityAlerts)
          setEnableStepsAlert(userSnap.data().stepAlerts)
          setEnableHeartbeatAlert(userSnap.data().heartAlerts)
          const fitbitAuth = String(userSnap.data().fitbitAuth)
          setHasFitbitLinked(fitbitAuth.length != 0)
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false);
      }
    }
    fetchData()
  }, []);

  useEffect(() => {
    saveData()
  }, [address, email, name, phone, physicianName, physicianNumber,
    enableStepsAlert, enableNoActivityAlert, enableHeartbeatAlert,
    heartbeatUpperThreshold, heartbeatLowerThreshold, stepsUpperThreshold,
    stepsLowerThreshold, noActivityUpperThreshold
  ]);


  if (loading) {
    return <StyledSurface className="flex flex-col h-[100%] justify-center">
      <ActivityIndicator animating={true} size="large"></ActivityIndicator>
    </StyledSurface>
  }

  const toggleHeartbeatMarker = () => {
    setShowHeartbeatMarker(!showHeartbeatMarker);
    saveData() //Handles changes to sliders
  }


  return (
    <StyledSurface className="flex-grow flex">
      <StyledSurface elevation={0} mode="flat" className="flex flex-row justify-between items-center">
        <StyledText className="" variant='displayLarge'
                    style={{backgroundColor: theme.colors.elevation.level2}}>Profile</StyledText>
        <StyledIconButton icon="cog" animated={true} className="" onPress={() => router.push("/modals/modal")}/>
      </StyledSurface>
      <StyledButton mode="outlined" onPress={async () => {
        let result = await WebBrowser.openBrowserAsync(fitbitLink)
      }}>Link Fitbit</StyledButton>

      <StyledScrollView className="flex flex-grow" style={{backgroundColor: theme.colors.surfaceVariant}}
                        scrollEnabled={!showHeartbeatMarker}>
        <StyledTextInput mode="flat" label="Timezone"
                         value={Localization.getCalendars()[0].timeZone?.toString()} onPress={() => {
        }}/>
        <StyledTextInput mode="flat" label="Full Name" value={name} onChangeText={setName}/>
        <StyledTextInput mode="flat" label="Address" value={address} onChangeText={setAddress}/>
        <StyledTextInput mode="flat" label="Phone Number" value={phone} onChangeText={setPhone}/>
        <StyledTextInput mode="flat" label="Email Address" value={email} onChangeText={setEmail}/>
        <StyledTextInput mode="flat" label="Physician Name" value={physicianName}
                         onChangeText={setPhysicianName}/>
        <StyledTextInput mode="flat" label="Physician Number" value={physicianNumber}
                         onChangeText={setPhysicianNumber}/>
        {/* Heartbeat Alerts */}
        <StyledSurface elevation={0} mode="flat"
                       className="flex flex-row items-center justify-between flex-grow pt-2">
          <StyledText
            className="px-3"
            variant="titleMedium"
            style={{color: theme.colors.onTertiaryContainer}}
          >
            Heartbeat Alerts
          </StyledText>
          <StyledSwitch
            className="mr-1"
            value={enableHeartbeatAlert}
            onChange={() => setEnableHeartbeatAlert(!enableHeartbeatAlert)}
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
            values={[heartbeatLowerThreshold, heartbeatUpperThreshold]}
            enabledTwo={true}
            min={20}
            max={200}
            enableLabel={showHeartbeatMarker}
            onValuesChangeStart={toggleHeartbeatMarker}
            onValuesChangeFinish={toggleHeartbeatMarker}
            onValuesChange={values => {
              setHeartbeatLowerThreshold(values[0])
              setHeartbeatUpperThreshold(values[1])
            }}
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
            Steps Alerts
          </StyledText>
          <StyledSwitch
            className="mr-1"
            value={enableStepsAlert}
            onChange={() => setEnableStepsAlert(!enableStepsAlert)}
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
            values={[stepsLowerThreshold, stepsUpperThreshold]}
            enabledTwo={true}
            step={250}
            min={0}
            max={20000}
            enableLabel={showHeartbeatMarker}
            onValuesChangeStart={toggleHeartbeatMarker}
            onValuesChangeFinish={toggleHeartbeatMarker}
            onValuesChange={(values: number[]) => {
              setStepsLowerThreshold(values[0])
              setStepsUpperThreshold(values[1])
            }}
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
            No Activity Alerts
          </StyledText>
          <StyledSwitch
            className="mr-1"
            value={enableNoActivityAlert}
            onChange={() => setEnableNoActivityAlert(!enableNoActivityAlert)}
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
            values={[noActivityUpperThreshold]}
            enableLabel={showHeartbeatMarker}
            onValuesChangeStart={toggleHeartbeatMarker}
            onValuesChangeFinish={toggleHeartbeatMarker}
            onValuesChange={(values: number[]) => {
              setNoActivityUpperThreshold(values[0])
            }}
          />
        </StyledSurface>
        <StyledSurface className="my-5 h-[200] bg-transparent">
          <View></View>
        </StyledSurface>
        {/* Steps Alerts End */}
      </StyledScrollView>
    </StyledSurface>
  );
}
