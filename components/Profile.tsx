import { Text, View } from 'react-native';

export const Profile = ({ user }: { user: string | string[] | null }) => {
  return (
    <View>
      <Text>user: {user}</Text>
    </View>
  );
};
