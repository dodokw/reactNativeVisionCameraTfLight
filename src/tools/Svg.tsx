import React from 'react';
import Home from '../assets/image/svg/HomeIcon.svg';
import Profile from '../assets/image/svg/ProfileIcon.svg';
import Search from '../assets/image/svg/serachIcon.svg';
import States from '../assets/image/svg/StatesIcon.svg';
import Workout from '../assets/image/svg/WorkoutIcon.svg';

type IconProps = {
  width: number | string;
  height: number | string;
  color?: string | undefined;
  style?: React.CSSProperties | any | undefined;
};

export const SearchIcon = ({ width, height, color, style }: IconProps) => {
  return <Search width={width} height={height} color={color} style={style} />;
};

export const HomeIcon = ({ width, height, color, style }: IconProps) => {
  return <Home width={width} height={height} color={color} style={style} />;
};

export const ProfileIcon = ({ width, height, color, style }: IconProps) => {
  return <Profile width={width} height={height} color={color} style={style} />;
};

export const StatesIcon = ({ width, height, color, style }: IconProps) => {
  return <States width={width} height={height} color={color} style={style} />;
};

export const WorkoutIcon = ({ width, height, color, style }: IconProps) => {
  return <Workout width={width} height={height} color={color} style={style} />;
};
