import {SafeAreaView, View} from "react-native";
import {Button, PaperProvider, Snackbar, Text, TextInput} from "react-native-paper";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "@firebase/auth";
import {useTheme} from 'react-native-paper';
import {useState} from "react";
import {auth} from "@/firebase-config"
import {router} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {FirebaseError} from "@firebase/util";
import {getAuth, onAuthStateChanged} from "firebase/auth";

//LOGIN PAGE

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
                <SafeAreaView style={{
                    flex: 1,
                    backgroundColor: theme.colors.background
                }}>
                    <View
                        style={{
                            flex: 1
                        }}>
                        <View>
                            <Text variant="displayLarge"
                                  theme={theme}
                                  style={{flex: 1, backgroundColor: 'black'}}>Log In</Text>
                        </View>
                        <TextInput
                            mode="outlined"
                            label="Email Address"
                            value={email}
                            theme={theme}
                            onChangeText={email => {
                                setEmail(email)
                            }}
                        ></TextInput>
                        <TextInput
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
                        ></TextInput>
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
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </PaperProvider>
    );
}