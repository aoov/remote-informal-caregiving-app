
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

const PersonalCode: React.FC = () => {
  const [code, setCode] = useState<string>('Q4SRT');

  const resetCode = (): void => {
    setCode('NEWCD');
  };

  return (
    <View className="flex-1 bg-pink-50 p-5 pt-16">
      <Text className="text-lg text-center mb-2">Your Personal Code:</Text>
      <Text className="text-4xl font-bold text-center mb-5">{code}</Text>
      <View className="flex-row justify-between mb-8">
        <TouchableOpacity className="bg-purple-500 p-2 rounded-xl">
          <Text className="text-white">Share</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-2 rounded-xl">
          <Text>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-pink-300 p-2 rounded-xl" onPress={resetCode}>
          <Text>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-base mb-2 text-center">Add Another via Code</Text>
      <View className="flex-row items-center justify-center">
        <TextInput placeholder="Enter Code or Link" className="flex-1 p-2 bg-white rounded-xl mr-2" />
        <TouchableOpacity className="bg-indigo-600 p-3 rounded-xl">
          <Text className="text-white">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PersonalCode;
