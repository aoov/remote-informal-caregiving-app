import {styled} from 'nativewind'
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
import {auth, db, functions} from '@/shared/firebase-config'
import {collection, getDoc, Timestamp} from 'firebase/firestore';
import {router} from "expo-router";
import {Modal, SafeAreaView, ScrollView} from "react-native";
import {httpsCallable} from "@firebase/functions";
import {doc, setDoc} from "@firebase/firestore";

const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledSwitch = styled(Switch)
const StyledButton = styled(Button)
const StyledIconButton = styled(IconButton)

export default function SettingsPage() {

  const makeAlerts = async () => {
    if (!auth.currentUser){
      return
    }
    const updateHeart = httpsCallable(functions, "updateHeart");
    await updateHeart({
      requester: auth.currentUser.uid,
      userID: auth.currentUser.uid,
    })
    console.log("updateHeart called");
  }


  return (
    <Modal animationType="slide">
      <SafeAreaView style={{flex: 1}}>
        <StyledSurface className="flex h-[100%] justify-between p-2">
          <StyledButton mode="outlined" className="flex" onPress={() => {
            auth.signOut().then(r => router.push("/"))
          }}>Logout</StyledButton>
          <StyledButton mode="outlined" className="flex" onPress={makeAlerts}>test</StyledButton>
          <StyledButton mode="outlined" className="flex" onPress={() => router.back()}>Back</StyledButton>
        </StyledSurface>
      </SafeAreaView>
    </Modal>
  );
}