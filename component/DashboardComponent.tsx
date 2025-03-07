import React from 'react';
import {Button, Card, Text} from 'react-native-paper';
import { TouchableRipple } from 'react-native-paper';
import AvatarIcon from "react-native-paper/src/components/Avatar/AvatarIcon";
import {styled} from "nativewind";
import {useState} from "react";
import {auth} from "@/firebase-config"
import {router} from "expo-router"

const StyledButton = styled(Button)
const StyledCardTitle = styled(Card.Title)
const StyledCard = styled(Card)
const StyledCardContent = styled(Card.Content)
const StyledText = styled(Text)

interface Props {
    userID: string;
}

export const DashboardComponent:React.FC<Props> = ({userID}) => {
    const [subtitle, setSubtitle] = React.useState("Last Updated: Never");

    const handleCardPress = () => {
        setSubtitle("Last Update: Now")
        auth.signOut()
        router.replace("/")
    };

    return (
        <TouchableRipple onPress={handleCardPress}>
                <StyledCard mode="elevated" className="mx-5 mb-5">
                    <StyledCardTitle title={userID} subtitle={subtitle}
                                     left={(props) =>
                                         <AvatarIcon {...props} icon='account'/>}>
                    </StyledCardTitle>
                </StyledCard>
        </TouchableRipple>
    );
};
