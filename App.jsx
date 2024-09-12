import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  NativeEventEmitter,
  NativeModules,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { isValidFile, showEditor } from 'react-native-video-trim';
import { launchImageLibrary } from 'react-native-image-picker';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState(null); // Store video URI
  const [trimmedVideoUri, setTrimmedVideoUri] = useState(null); // Store trimmed video URI

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to save Videos',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage Permission Denied.');
        }
      } catch (err) {
        console.warn(err);
      }
    };

    if (Platform.OS === 'android') {
      requestPermissions();
    }

    // Add event listener for VideoTrim
    const eventEmitter = new NativeEventEmitter(NativeModules.VideoTrim);
    const subscription = eventEmitter.addListener('VideoTrim', (event) => {
      switch (event.name) {
        case 'onShow':
          console.log('Event: onShow', event);
          break;
        case 'onError':
          Alert.alert('Error', `Error: ${event.message || 'Failed to retrieve video info. Please try again.'}`);
          setLoading(false);
          break;
        case 'onSave':
          console.log('Trimmed video saved:', event.uri);
          setTrimmedVideoUri(event.uri); // Store trimmed video URI
          setLoading(false);
          break;
        default:
          console.log(`Event: ${event.name}`, event);
          break;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLaunchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        assetRepresentationMode: 'current',
      });

      if (result.didCancel) {
        console.log('User cancelled video selection');
        setLoading(false);
        return;
      }

      const videoUri = result.assets?.[0]?.uri || '';
      setVideoUri(videoUri); // Store selected video URI

      if (videoUri) {
        const isValid = await isValidFile(videoUri);
        if (isValid) {
          showEditor(videoUri, {
            maxDuration: 60,
            saveToPhoto: true,
            cancelDialogConfirmText: "Yes",
            cancelDialogCancelText: "No",
            saveDialogCancelText: "No",
            saveDialogConfirmText: "Yes",
            enableHapticFeedback: false
          });
        } else {
          Alert.alert('Invalid Video', 'The selected video file is not valid.');
        }
      } else {
        Alert.alert('No Video Found', 'No video URI was found.');
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'An error occurred while selecting the video.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          <TouchableOpacity onPress={handleLaunchLibrary} style={styles.button}>
            <Text style={styles.buttonText}>Select Video</Text>
          </TouchableOpacity>

          
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  button: {
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
