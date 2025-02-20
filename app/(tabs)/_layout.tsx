import * as React from 'react';
import {SafeAreaView, Text} from 'react-native';
import {PaperProvider, BottomNavigation} from 'react-native-paper';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import HomeScreen from './index';
import AlertsScreen from './alerts';
import ProfileScreen from './profile';

const Tab = createBottomTabNavigator();

function AppLayout() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
            }}
            tabBar={({navigation, state, descriptors, insets}) => (
                <BottomNavigation.Bar
                    navigationState={state}
                    safeAreaInsets={insets}
                    onTabPress={({route, preventDefault}) => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    }}
                    renderIcon={({route, focused, color}) => {
                        const {options} = descriptors[route.key];
                        return options.tabBarIcon ? options.tabBarIcon({focused, color, size: 24}) : null;
                    }}
                    getLabelText={({route}) => {
                        const {options} = descriptors[route.key];
                        // Ensure this returns a string or undefined
                        return options.tabBarLabel as string || options.title || route.name;
                    }}
                />
            )}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home', // Ensure this is a string
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="account-group" color={color} size={size}/>
                    ),
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: 'Alerts', // Ensure this is a string
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="bell" color={color} size={size}/>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile', // Ensure this is a string
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="account" color={color} size={size}/>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaView style={{flex: 1}}>
            <PaperProvider>
                <AppLayout/>
            </PaperProvider>
        </SafeAreaView>
    );
}