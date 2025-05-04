import {
  Button,
  Divider,
  PaperProvider,
  Snackbar,
  Text,
  TextInput,
  MD3DarkTheme,
  MD3LightTheme, Surface, HelperText, ActivityIndicator
} from "react-native-paper";
import {app, auth, db} from '@/shared/firebase-config'
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import {useTheme} from 'react-native-paper';
import {useEffect, useState} from "react";
import {router} from "expo-router";
import {FirebaseError} from "@firebase/util";
import {onAuthStateChanged} from "firebase/auth";
import {styled} from 'nativewind'
import {Colors} from '@/assets/Colors'
import {doc, setDoc} from "@firebase/firestore";
import {KeyboardAvoidingView, Platform, ScrollView} from "react-native";
//LOGIN PAGE

const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledSurface = styled(Surface)
const StyledHelperText = styled(HelperText)
const StyledSnackbar = styled(Snackbar)
const StyledScrollView = styled(ScrollView)
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView)

const customDarkTheme = {...MD3DarkTheme, colors: Colors.dark};
const customLightTheme = {...MD3LightTheme, colors: Colors.light};

export default function Index() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState('Error');
  const [isSignUp, setIsSignUp] = useState(false);
  const [validEmail, setValidEmail] = useState(true);
  const [validPassword, setValidPassword] = useState(true);
  const [validPasswordConfirm, setValidPasswordConfirm] = useState(true);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validName, setValidName] = useState(true);
  const [validPhone, setValidPhone] = useState(true);
  const [emailInUse, setEmailInUse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User authenticated, checking destination...");
        console.log("Destination is: " + destination);

        if (destination) {
          console.log("Pushing to: " + destination); // Ensure it's the correct destination
          // @ts-ignore
          router.push({
            pathname: "/dashboard",
            params: { x: destination },
          });
        } else {
          console.log("Pushing to default: /dashboard");
          router.push("/dashboard");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [destination]);

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      //On sign in
      router.push("/dashboard")
    } catch (error) {
      if (error instanceof FirebaseError) {
        toggleSnackbar(error.message);
      }
      console.log(error);
    }
  }

  const signUp = async () => {
    let fieldsValid = true
    //Activates the sign-up fields
    if (!isSignUp) {
      setIsSignUp(true)
      return
    }
    //Validates signup fields
    if (!validateEmail()) {
      fieldsValid = false;
    }
    if (!validatePassword()) {
      fieldsValid = false;
    }
    if (passwordConfirm != password) {
      fieldsValid = false;
    }
    if (!validateName()) {
      fieldsValid = false;
    }
    if (!validatePhone()) {
      fieldsValid = false;
    }
    if (!fieldsValid) {
      return;
    }
    console.log("setting destination profile")
    // @ts-ignore
    setDestination("/profile");
    try {
      //Create account and database document
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user
      await setDoc((doc(db, `users/${user.uid}`)), {
        displayName: name,
        email: email,
        phone: phone,
        //Default values
        address: "",
        physicianName: "",
        physicianNumber: "",
        fitbitAuth: "",
        fitbitRefresh: "",
        photoURL: ""
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          setEmailInUse(true)
        }
      }
      console.log(error);
    }
  }
  const toggleShowPassword = () => {
    setHidePassword(!hidePassword);
  }

  const toggleSnackbar = (text: string) => {
    setShowSnackbar(!showSnackbar);
    if (text) {
      setSnackbarText(text);
    }
  }

  const validateEmail = () => {
    if (email.includes('@')) {
      setValidEmail(true);
      return true
    } else {
      setValidEmail(false);
      return false
    }
  }
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  const numberRegex = /\d/
  const validatePassword = () => {
    if (password.length <= 6) { //Length less than 6
      setValidPassword(false);
      return false
    }
    if (!specialCharRegex.test(password)) { //No Special Character
      setValidPassword(false);
      return false;
    }
    if (!numberRegex.test(password)) { //No Number
      setValidPassword(false);
      return false;
    } else {
      setValidPassword(true)
      return true
    }
  }

  const validateName = () => {
    if (name.length <= 6) {
      setValidName(false);
      return false;
    }
    setValidName(true);
    return true
  }

  const validatePhone = () => {
    if (phone.length <= 6) {
      setValidPhone(false);
      return false;
    }
    setValidPhone(true)
    return true
  }
  if (loading) {
    return <StyledSurface className="flex flex-col h-[100%] justify-center">
      <ActivityIndicator animating={true} size="large"></ActivityIndicator>
    </StyledSurface>
  }

  return (
    <StyledKeyboardAvoidingView className="flex-1"
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <PaperProvider theme={MD3LightTheme}>
        <StyledSurface className="flex-grow " mode='flat'>
          <StyledScrollView className="">
            <StyledText variant="displayMedium" className="px-4"
            >Carebit</StyledText>
            <Divider horizontalInset={true}/>
            <Text variant="displayLarge" className="text-center flex justify-center items-center my-12">
              {(isSignUp && "Sign Up") || (!isSignUp && "Login")}</Text>
            <StyledTextInput
              mode="outlined"
              label="Email Address"
              textContentType="emailAddress"
              value={email}
              autoCorrect={false}
              onChangeText={email => {
                setEmail(email)
              }}
              error={!validEmail}
              className="mx-3 mb-2"
            ></StyledTextInput>
            {!validEmail && <StyledHelperText type={"error"} visible={!validEmail}>
                Please enter a valid email.</StyledHelperText>}
            {emailInUse && <StyledHelperText type={"error"} visible={emailInUse}>
                Email is already in use. Please login or reset your password</StyledHelperText>}
            <StyledTextInput
              mode="outlined"
              label="Password"
              value={password}
              secureTextEntry={hidePassword}
              textContentType="none"
              right={<TextInput.Icon
                icon="eye"
                onPress={() => {
                  toggleShowPassword()
                }}
              />}
              onChangeText={password => {
                setPassword(password)
              }}
              className="mx-3">
            </StyledTextInput>
            {!validPassword && isSignUp && <StyledHelperText type={"error"} visible={!validPassword}>
                Passwords must contain a number, special character and at least 6
                characters.</StyledHelperText>}
            {/* Additional Sign Up Fields*/}
            {isSignUp &&
                <StyledSurface elevation={0} mode="flat">
                    <StyledTextInput
                        mode="outlined"
                        label="Confirm Password"
                        textContentType="none"
                        value={passwordConfirm}
                        secureTextEntry={hidePassword}
                        right={<TextInput.Icon
                          icon="eye"
                          onPress={() => {
                            toggleShowPassword()
                          }}
                        />}
                        onChangeText={password => {
                          setPasswordConfirm(password)
                        }}
                        className="mx-3 mt-3"
                    ></StyledTextInput>
                  {!validPasswordConfirm && <StyledHelperText type="error" visible={!validPasswordConfirm}>
                      Passwords do not match.
                  </StyledHelperText>}
                    <StyledTextInput
                        mode="outlined"
                        label="Full Name"
                        value={name}
                        textContentType="name"
                        onChangeText={name => {
                          setName(name)
                        }}
                        className="mx-3 mt-3"
                    ></StyledTextInput>
                  {!validName && <StyledHelperText type="error" visible={!validName}>
                      Please enter a valid name.
                  </StyledHelperText>}
                    <StyledTextInput
                        mode="outlined"
                        label="Phone Number"
                        value={phone}
                        textContentType="telephoneNumber"
                        onChangeText={phone => {
                          setPhone(phone)
                        }}
                        className="mx-3 mt-3"
                    ></StyledTextInput>
                  {!validPhone && <StyledHelperText type="error" visible={!validPhone}>
                      Please enter a phone number.
                  </StyledHelperText>}
                </StyledSurface>}
            {!isSignUp && <Button
                mode="outlined"
                onPress={signIn}
                className="mx-3 mt-5"
            >Log In</Button>}
            <Button
              mode="outlined"
              onPress={() => signUp()}
              className="mx-3 mt-3"
            >Sign Up</Button>
            {isSignUp && <Button
                mode="outlined"
                onPress={() => {
                  setIsSignUp(false)
                  setEmailInUse(false)
                  setValidName(true)
                  setValidPhone(true)
                  setValidEmail(true)
                  setValidPassword(true)
                }}
                className="mx-3 mt-3"
            >Back</Button>}
            <StyledSnackbar //TODO convert snackbar to helper text instead
              className="fixed inset-x-0 bottom-0 p-4"
              visible={showSnackbar}
              onDismiss={() => toggleSnackbar('')}
              action={{label: "Dismiss", onPress: () => setShowSnackbar(false)}}
            >{snackbarText}</StyledSnackbar>
          </StyledScrollView>
        </StyledSurface>
      </PaperProvider>
    </StyledKeyboardAvoidingView>
  );
}