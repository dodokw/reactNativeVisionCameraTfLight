import React from 'react';
import { Text, TextProps } from 'react-native';
import styled from 'styled-components/native';

interface CustomTextProps extends TextProps {
  color?: string;
  size?: number;
}

const BaseText = styled(Text)<CustomTextProps>`
  color: ${({ color }) => color || '#333333'};
  font-size: ${({ size }) => size || 14}px;
`;

export const TextR = styled(BaseText)`
  font-family: 'SpoqaHanSansNeo-Regular';
`;

export const TextB = styled(BaseText)`
  font-family: 'SpoqaHanSansNeo-Bold';
`;

export const TextL = styled(BaseText)`
  font-family: 'SpoqaHanSansNeo-Light';
`;
