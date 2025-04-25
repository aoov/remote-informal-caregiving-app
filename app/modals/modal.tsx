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
import {getDoc} from 'firebase/firestore';
import {router} from "expo-router";
import {Modal, SafeAreaView, ScrollView} from "react-native";
import {httpsCallable} from "@firebase/functions";




const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledSwitch = styled(Switch)
const StyledButton = styled(Button)
const StyledIconButton = styled(IconButton)

export default function SettingsPage() {
  return (
    <Modal animationType="slide">
      <SafeAreaView style={{flex: 1}}>
        <StyledSurface className="flex h-[100%] justify-between p-2">
          <StyledButton mode="outlined" className="flex" onPress={() => {
            auth.signOut().then(r => router.push("/"))
          }}>Logout</StyledButton>
          <StyledButton mode="outlined" className="flex" onPress={() => {
            const updateSteps = httpsCallable(functions, "updateSteps")
            if(!auth.currentUser) {
              return;
            }
            updateSteps({
              requester: auth.currentUser.uid,
              userID: auth.currentUser.uid,
            }).then(r => {
              console.log("updateSteps called");
            }).catch(error => {
              console.error(error);
            })
          }}>Test</StyledButton>
          <StyledButton mode="outlined" className="flex" onPress={() => {
            const updateSteps = httpsCallable(functions, "updateHeart")
            if(!auth.currentUser) {
              return;
            }
            updateSteps({
              requester: auth.currentUser.uid,
              userID: auth.currentUser.uid,
            }).then(r => {
              console.log("updateHeart called");
            }).catch(error => {
              console.error(error);
            })
          }}>Test2</StyledButton>
          <StyledButton mode="outlined" className="flex" onPress={() => router.push('/profile')}>Back</StyledButton>
        </StyledSurface>
      </SafeAreaView>
    </Modal>
  );
}