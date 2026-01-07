import React from 'react';
import { KeyboardAvoidingView, ModalProps, Platform, Pressable, Modal as RNModal, View } from 'react-native';

type Props = ModalProps & {
  isOpen: boolean
  withInput?: boolean
}

export default function Modal({ isOpen, withInput, children, ...rest }: Props) {
  const content = withInput ?(
    <KeyboardAvoidingView
      className='items-center justify-center flex-1 px-3 bg-zinc-900/40'
      behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
    >{ children }</KeyboardAvoidingView>
  ) : (
    <View className='items-center justify-center flex-1 px-3 bg-zinc-900/60'>
      <Pressable 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={rest.onRequestClose}
      />
      <View>
        { children }
      </View>
    </View>
  )

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType='fade'
      statusBarTranslucent
      onRequestClose={rest.onRequestClose}
      {...rest}
    >
      {content}
    </RNModal>
  )
}