import React from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';

const users = [
  { id: '1', name: 'Isla Lang', lastUpdate: '1 hour ago' },
  { id: '2', name: 'Alexis Vo', lastUpdate: '1 hour ago' },
  { id: '3', name: 'Rory Little', lastUpdate: '14 minutes ago' },
  { id: '4', name: 'Joseph Cambell', lastUpdate: '2 days ago' },
  { id: '5', name: 'Lucca Good', lastUpdate: '10 seconds ago' },
];

const Dashboard = () => {
  const renderItem = ({ item }) => (
    <View className="bg-purple-50 rounded-xl p-4 mb-3">
      <Text className="text-lg font-semibold">{item.name}</Text>
      <Text className="text-sm text-gray-600">Last Update: {item.lastUpdate}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-purple-100 pt-10 px-4">
      <TextInput
        className="bg-purple-200 p-3 rounded-xl mb-4"
        placeholder="Search Community"
        placeholderTextColor="#999"
      />
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle="pb-24"
      />
    </View>
  );
};

export default Dashboard;

