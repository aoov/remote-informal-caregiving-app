import { Text, View } from "react-native";
import { Button } from 'react-native-paper'
import { useRouter } from 'expo-router';


export default function Dashboard() {
    const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button onPress={() => router.push('/dashboard')}> Test</Button>
    </View>
  );
}
