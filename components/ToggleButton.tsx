import { UIIcons } from '@/constants/icon';
import React from 'react';
import { Pressable } from 'react-native';
import { scale } from 'react-native-size-matters';

type Props = {
  isToggled: boolean;
  onPress?: () => void;
}

const ToggleButton = ({ isToggled, onPress }: Props) => {

  return (
    <Pressable
      onPress={onPress}
      style={{ 
        display: 'flex',
        alignItems: 'flex-end', 
        justifyContent: 'center', 
        overflow: 'visible',
        width: scale(60), 
        marginVertical: -1,
        position: 'relative'
      }}
    >
      {!isToggled ?
        <UIIcons.toggleLeft size={scale(38)} style={{ position: 'absolute' }}/>
        :
        <UIIcons.toggleRight size={scale(38)} style={{ position: 'absolute' }}/>
      }
    </Pressable>
  )
}

export default ToggleButton