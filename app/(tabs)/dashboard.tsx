import {Button, Card, Surface, Text} from 'react-native-paper'
import {useRouter} from 'expo-router';
import {styled} from "nativewind";
import AvatarIcon from "react-native-paper/src/components/Avatar/AvatarIcon";
import {DashboardComponent} from '@/component/DashboardComponent'

const StyledSurface = styled(Surface)


export default function Dashboard() {
    const router = useRouter();

    return (
        <StyledSurface className="flex-1 flex justify-center align-middle h-[90%]">
            <DashboardComponent userID={"TEST USER ID"}></DashboardComponent>

        </StyledSurface>
    );
}
