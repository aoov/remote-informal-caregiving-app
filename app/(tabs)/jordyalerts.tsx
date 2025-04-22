import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

interface UserData {
  id: string;
  name: string;
  heartRate: number;
  steps: number;
  detailedData: number[];
}

const data: UserData[] = [
  {
    id: '1',
    name: 'Alexis Vo',
    heartRate: 72,
    steps: 5400,
    detailedData: [65, 70, 75, 80, 85, 90, 95],
  },
  {
    id: '2',
    name: 'Rory Little',
    heartRate: 154,
    steps: 3000,
    detailedData: [120, 130, 140, 150, 160, 170, 180],
  },
];

const AlertsScreen: React.FC = () => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string): void => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View className="flex-1 bg-gray-100 p-5">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl mb-4 shadow">
            <Text className="text-lg font-bold mb-1">{item.name}</Text>
            <Text>Heart Rate: {item.heartRate} BPM</Text>
            <Text>Steps: {item.steps}</Text>
            <TouchableOpacity
              className="mt-3 bg-red-500 py-2 px-4 rounded-md items-center"
              onPress={() => toggleExpand(item.id)}
            >
              <Text className="text-white font-semibold">
                {expanded[item.id] ? 'Hide Details' : 'View Details'}
              </Text>
            </TouchableOpacity>
            {expanded[item.id] && (
              <LineChart
                data={{
                  labels: ['10m', '20m', '30m', '40m', '50m', '60m', '70m'],
                  datasets: [{ data: item.detailedData }],
                }}
                width={Dimensions.get('window').width - 40}
                height={200}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                bezier
                style={{ marginTop: 10 }}
              />
            )}
          </View>
        )}
      />
    </View>
  );
};

export default AlertsScreen;
