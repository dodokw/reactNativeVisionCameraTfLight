import React from 'react';
import Search from '../assets/image/svg/serachIcon.svg';

type IconProps = {
  width: number | string;
  height: number | string;
  color?: string | undefined;
  style?: React.CSSProperties | any | undefined;
};

export const SearchIcon = ({ width, height, color, style }: IconProps) => {
  return <Search width={width} height={height} color={color} style={style} />;
};
