import {SafeAreaView, View} from "react-native";
import {Button, PaperProvider, Snackbar, Text, TextInput} from "react-native-paper";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "@firebase/auth";
import {useTheme} from 'react-native-paper';
import {useState} from "react";
import {router} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {FirebaseError} from "@firebase/util";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import { styled } from 'nativewind'

//LOGIN PAGE

const StyledView = styled(View)
const StyledSafeAreaProvider = styled(SafeAreaProvider)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)


export default function Index() {
    const theme = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hidePassword, setHidePassword] = useState(true);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarText, setSnackbarText] = useState('Error');
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uid = user.uid;
            router.push("/dashboard")
        }
    });
    const signIn = async () => {
        try {
            const user = await signInWithEmailAndPassword(auth, email, password);
            //On signin
            router.push("/dashboard")
        } catch (error) {
            if (error instanceof FirebaseError) {
                toggleSnackbar(error.message);
            }
            console.log(error);
        }
    }

    const signUp = async () => {
        try {
            const user = await createUserWithEmailAndPassword(auth, email, password);
            router.push("/dashboard")
        } catch (error) {
            if (error instanceof FirebaseError) {
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

    return (
        <PaperProvider>
            <SafeAreaProvider>
                <SafeAreaView
                    style={{
                    flex: 1,
                    backgroundColor: theme.colors.background
                }}>
                    <StyledView className="flex-grow ">
                        <StyledView className="">
                            <Text variant="displayLarge"
                                  theme={theme}>Log In</Text>
                        </StyledView>
                        <StyledTextInput
                            mode="outlined"
                            label="Email Address"
                            value={email}
                            theme={theme}
                            onChangeText={email => {
                                setEmail(email)
                            }}
                        ></StyledTextInput>
                        <StyledTextInput
                            mode="outlined"
                            label="Password"
                            value={password}
                            theme={theme}
                            secureTextEntry={hidePassword}
                            right={<TextInput.Icon
                                icon="eye"
                                theme={theme}
                                onPress={() => {
                                    toggleShowPassword()
                                }}
                            />}
                            onChangeText={password => {
                                setPassword(password)
                            }
                            }
                        ></StyledTextInput>
                        <Button
                            mode="outlined"
                            theme={theme}
                            onPress={signIn}
                        >Log In</Button>
                        <Button
                            mode="outlined"
                            theme={theme}
                            onPress={signUp}
                        >Sign Up</Button>
                        <Snackbar
                            visible={showSnackbar}
                            onDismiss={() => toggleSnackbar}
                            theme={theme}
                            action={{label: "Dismiss", onPress: () => setShowSnackbar(false)}}
                        >{snackbarText}</Snackbar>
                    </StyledView>
                </SafeAreaView>
            </SafeAreaProvider>
        </PaperProvider>
    );
}