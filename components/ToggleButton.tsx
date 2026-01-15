import { UIIcons } from '@/constants/icon';
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { scale } from 'react-native-size-matters';

type Props = {
  onPress?: () => void;
}

const ToggleButton = ({ onPress }: Props) => {
  const [isToggled, setIsToggled] = useState(false)

  return (
    <Pressable
      onPress={() => {
        onPress
        setIsToggled(prev => !prev)
      }}
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