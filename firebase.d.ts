import { Persistence } from 'firebase/auth';
import {AsyncStorageStatic} from "@react-native-async-storage/async-storage";
declare module 'firebase/auth' {
  function getReactNativePersistence(ReactNativeAsyncStorage: AsyncStorageStatic);
}