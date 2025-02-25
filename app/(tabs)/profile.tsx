import {Text, View} from "react-native";
import {Button} from "react-native-paper";
import {getAuth} from "@firebase/auth";
import {auth} from '@/firebase-config'
import {router} from "expo-router";

export default function Index() {
    getAuth().onAuthStateChanged((user) => {
        if (!user) {
            router.replace("/");
        }
    })
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text>Profile screen</Text>
            <Button onPress={() => auth.signOut()}>Sign Out</Button>
        </View>
    );
}