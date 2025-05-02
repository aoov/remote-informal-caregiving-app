import {styled} from 'nativewind'
import {
  ActivityIndicator,
  Button, HelperText,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";
import {auth, db, functions} from '@/shared/firebase-config'
import {collection, getDoc, getDocs, where, query, Timestamp} from 'firebase/firestore';
import {router} from "expo-router";
import {Modal, SafeAreaView, ScrollView} from "react-native";
import {httpsCallable} from "@firebase/functions";
import {useState} from "react";
import {doc, setDoc} from "@firebase/firestore";


const StyledSurface = styled(Surface)
const StyledIcon = styled(Icon)
const StyledScrollView = styled(ScrollView)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledSwitch = styled(Switch)
const StyledButton = styled(Button)
const StyledIconButton = styled(IconButton)

type HelperType = "info" | "error"

interface User {
  email: string;
  phone: string;
}

export default function AddingPage() {

  const [hasError, setHasError] = useState(false)
  const [added, setAdded] = useState(false)
  const [input, setInput] = useState('')
  const [helperType, setHelperType] = useState<HelperType>("info")
  const [helperText, setHelperText] = useState("")
  const [showHelper, setShowHelper] = useState(false)

  const resetHelper = () => {
    setAdded(false)
    setHasError(false)
    setShowHelper(false)
  }

  const setError = () => {
    setHelperText("User not found! Please check your input and try again")
    setHelperType("error")
    setHasError(true)
    setShowHelper(true)
  }

  const setHasAdded = () => {
    setHelperType("info")
    setHelperText("Request successfully sent to user!")
    setAdded(true)
    setShowHelper(true)
    //TODO Check if already added
  }

  const addUser = async () => {
    const output = await getUserIdByIdentifier(input)
    if (output) {
      if(!auth.currentUser){
        return;
      }
      const userRef = doc(db, "users", auth.currentUser.uid)
      const userSnap = await getDoc(userRef)
      if(!userSnap.data()) {
        return;
      }
      setHasAdded()
      await setDoc(doc(collection(db, `users`, output, "alerts")), {
        userID: auth.currentUser.uid,
        // @ts-ignore
        name: userSnap.data().displayName,
        type: "request",
        date: Timestamp.now(),
        threshold: 0,
        observed: 0,
        read: false,
      });

    }else{
      setError()
    }
  }

  async function getUserIdByIdentifier(
    identifier: string
  ): Promise<string | null> {
    const usersRef = collection(db, "users");

    try {
      // First try to find by email
      const emailQuery = query(usersRef, where("email", "==", identifier));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        return emailSnapshot.docs[0].id;
      }

      // If not found by email, try by phone
      const phoneQuery = query(usersRef, where("phone", "==", identifier));
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        return phoneSnapshot.docs[0].id;
      }

      // If not found by either
      return null;
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  }

  return (
    <Modal animationType="slide">
      <SafeAreaView style={{flex: 1}}>
        <StyledSurface className="flex h-[100%] p-2 px-3">
          <StyledButton mode="outlined" className="flex"
                        onPress={() => router.push('/(tabs)/dashboard')}>Back</StyledButton>
          <StyledText className="flex pt-[20%] text-center mb-10" variant="displayLarge">Add A Friend</StyledText>
          <StyledTextInput className="flex" mode="outlined" error={hasError} value={input} onChangeText={(text) => {
            setInput(text)
            resetHelper()
          }}
                           autoFocus={true}
                           placeholder="Enter Email or Phone Number"></StyledTextInput>
          <HelperText type={helperType} visible={showHelper}>{helperText}</HelperText>
          <StyledButton mode="outlined" onPress={addUser}>Add</StyledButton>
        </StyledSurface>
      </SafeAreaView>
    </Modal>
  );
}