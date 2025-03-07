import {ScrollView} from "react-native";
import {ActivityIndicator, Icon, Surface, Switch, Text, TextInput} from "react-native-paper";
import {styled} from 'nativewind'
import {useTheme} from "react-native-paper";
import * as Localization from 'expo-localization'
import {useEffect, useState} from "react";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import {db, auth} from '@/firebase-config'
import {getDoc} from 'firebase/firestore';
import {router} from "expo-router";
import {doc} from "@firebase/firestore";


const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledMultiSlider = styled(MultiSlider)
const StyledSwitch = styled(Switch)

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
    const [noActivityLowerThreshold, setNoActivityLowerThreshold] = useState(0);
    const [showHeartbeatMarker, setShowHeartbeatMarker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try{
                const currentUser = auth.currentUser
                if(!currentUser){
                    router.push('/')
                    setLoading(false)
                    return;
                }
                const userID = currentUser.uid
                const userRef = doc(db, "users", userID)
                const userSnap = await getDoc(userRef)
                if (userSnap.exists()) {
                    setName(userSnap.data().displayName)
                    setAddress(userSnap.data().address)
                    setPhone(userSnap.data().phone)
                    setPhysicianName(userSnap.data().physicianName)
                    setPhysicianNumber(userSnap.data().physicianNumber)

                } else {
                    console.log('No such document!');
                }

            }catch (error){
                console.error(error)
            } finally {
                setLoading(false);
            }
        }
        fetchData()
    }, []);

    if (loading){
        return <ActivityIndicator animating={true} size="large"></ActivityIndicator>
    }


    const toggleHeartbeatMarker = () => {
        setShowHeartbeatMarker(!showHeartbeatMarker);
    }

    return (
        <StyledSurface className="flex-grow flex">
            <StyledSurface elevation={0} mode="flat" className="flex">
                <StyledText className="" variant='displayLarge'
                            style={{backgroundColor: theme.colors.elevation.level2}}> Profile</StyledText>
            </StyledSurface>
            <StyledScrollView className="flex flex-grow" style={{backgroundColor: theme.colors.surfaceVariant}} scrollEnabled={!showHeartbeatMarker}>
                <StyledTextInput mode="flat" label="Timezone"
                                 value={Localization.getCalendars()[0].timeZone?.toString()} onPress={() => {}}/>
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
                        enableLabel={showHeartbeatMarker}
                        onValuesChangeStart={toggleHeartbeatMarker}
                        onValuesChangeFinish={toggleHeartbeatMarker}
                    />
                </StyledSurface>
                {/* Steps Alerts End */}




            </StyledScrollView>

        </StyledSurface>
    );
}
