import React from 'react';
import { Modal, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';

const KINETIC_COLORS = Colors.kinetic;

type CustomAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const isDualAction = Boolean(cancelText);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={isDualAction && onCancel ? onCancel : onConfirm}
    >
      <Backdrop>
        <Card>
          <Title size={22} color={KINETIC_COLORS.onSurface}>
            {title}
          </Title>
          <Message size={14} color={KINETIC_COLORS.onSurfaceVariant}>
            {message}
          </Message>
          <ActionRow>
            {isDualAction && onCancel ? (
              <SecondaryButton as={Pressable} onPress={onCancel}>
                <TextB size={15} color={KINETIC_COLORS.onSurface}>
                  {cancelText}
                </TextB>
              </SecondaryButton>
            ) : null}
            <PrimaryButton as={Pressable} onPress={onConfirm}>
              <TextB size={15} color="#000000">
                {confirmText}
              </TextB>
            </PrimaryButton>
          </ActionRow>
        </Card>
      </Backdrop>
    </Modal>
  );
};

const Backdrop = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-horizontal: 28px;
  background-color: rgba(0, 0, 0, 0.52);
`;

const Card = styled.View`
  width: 100%;
  max-width: 340px;
  padding: 24px 20px 20px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surface};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const Title = styled(TextB)`
  text-align: center;
`;

const Message = styled(TextR)`
  margin-top: 12px;
  text-align: center;
  line-height: 21px;
`;

const ActionRow = styled.View`
  flex-direction: row;
  margin-top: 22px;
`;

const BaseButton = styled.View`
  flex: 1;
  min-height: 50px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
`;

const SecondaryButton = styled(BaseButton)`
  margin-right: 10px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.04);
`;

const PrimaryButton = styled(BaseButton)`
  background-color: ${KINETIC_COLORS.primary};
`;
