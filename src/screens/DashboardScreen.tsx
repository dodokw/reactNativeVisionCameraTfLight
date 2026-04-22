import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useModel } from '../contexts/ModelContext';
import { BouncyButton } from '../components/BouncyButton';
import { Colors } from '../tools/Colors';

export const DashboardScreen = () => {
  const { state: modelState } = useModel();
  const isFirstLaunch = useSelector(
    (state: RootState) => state.app.isFirstLaunch,
  );

  const [stitchData, setStitchData] = useState<{
    exercisesCompleted: number;
    totalWorkouts: number;
    lastWorkoutDate?: string;
    loading: boolean;
  }>({
    exercisesCompleted: 0,
    totalWorkouts: 0,
    loading: true,
  });

  const fetchDashboardData = async () => {
    try {
      setStitchData(prev => ({ ...prev, loading: true }));

      // Simulate fetching data from Stitch MCP server
      // In production, this would be replaced with actual MCP server calls
      const mockData = {
        exercisesCompleted: 42,
        totalWorkouts: 15,
        lastWorkoutDate: new Date().toISOString(),
      };

      setStitchData(prev => ({ ...prev, ...mockData, loading: false }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStitchData(prev => ({ ...prev, loading: false }));
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (state: string | undefined) => {
    if (state === 'loaded') return '#28a745';
    if (state === 'error') return '#dc3545';
    return '#ffc107';
  };

  const getStatusText = (state: string | undefined) => {
    switch (state) {
      case 'loaded':
        return 'Model Ready';
      case 'loading':
        return 'Loading Model...';
      case 'error':
        return 'Model Error';
      default:
        return 'Unknown State';
    }
  };

  const getProgressColor = (state: string | undefined) => {
    if (state === 'loaded') return '#28a745';
    if (state === 'error') return '#dc3545';
    return '#ffc107';
  };

  return (
    <Container>
      <Header>
        <Title>Dashboard</Title>
        <RefreshButton onPress={fetchDashboardData}>
          <RefreshIcon />
        </RefreshButton>
      </Header>

      <ScrollView>
        {/* Model Status Card */}
        <Card>
          <CardTitle>Model Status</CardTitle>
          <StatusText>{getStatusText(modelState)}</StatusText>
          <ProgressBar>
            {modelState?.toUpperCase() || 'UNKNOWN'}
          </ProgressBar>
        </Card>

        {/* Stitch Analytics Cards */}
        <AnalyticsSectionTitle>Stitch Analytics</AnalyticsSectionTitle>

        <Row>
          <StatCard>
            <StatValue>{stitchData.exercisesCompleted}</StatValue>
            <StatLabel>Exercises Completed</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stitchData.totalWorkouts}</StatValue>
            <StatLabel>Total Workouts</StatLabel>
          </StatCard>
        </Row>

        {stitchData.lastWorkoutDate && (
          <LastActivityCard>
            <LastActivityTitle>Last Workout</LastActivityTitle>
            <LastActivityText>
              {new Date(stitchData.lastWorkoutDate).toLocaleDateString()}
            </LastActivityText>
          </LastActivityCard>
        )}

        {/* Quick Actions */}
        <ActionsSectionTitle>Quick Actions</ActionsSectionTitle>

        <Row>
          <BouncyButton onPress={fetchDashboardData}>
            <ActionButtonContainer>
              <ActionButtonText>Refresh Data</ActionButtonText>
            </ActionButtonContainer>
          </BouncyButton>
          <BouncyButton onPress={() => console.log('Navigate to Camera')}>
            <ActionButtonContainer>
              <ActionButtonText>Start Camera</ActionButtonText>
            </ActionButtonContainer>
          </BouncyButton>
        </Row>

        {/* App Info Card */}
        <InfoCard>
          <InfoTitle>App Information</InfoTitle>
          <InfoItem>
            <InfoLabel>First Launch:</InfoLabel>
            <InfoValue>{isFirstLaunch ? 'Yes' : 'No'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Data Source:</InfoLabel>
            <InfoValue>Stitch MCP Server</InfoValue>
          </InfoItem>
        </InfoCard>
      </ScrollView>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${Colors.background};
`;

const Header = styled.View`
  padding: 20px;
  background-color: ${Colors.button};
  align-items: center;
  justify-content: space-between;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: ${Colors.white};
`;

const RefreshButton = styled(TouchableOpacity)`
  padding: 10px;
`;

// const scrollContentStyles = {
//   flex: 1,
//   justifyContent: 'flex-start',
//   padding: 20,
// };

const Card = styled(View)`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
`;

const StatusText = styled(Text)`
  font-size: 16px;
  color: #666;
`;

const ProgressBar = styled(View)`
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
`;

const AnalyticsSectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatCard = styled(Card)`
  flex: 1;
  align-items: center;
  padding: 20px;
`;

const StatValue = styled(Text)`
  font-size: 32px;
  font-weight: bold;
  color: ${Colors.button};
`;

const StatLabel = styled(Text)`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

const LastActivityCard = styled(Card)`
  background-color: #f8f9fa;
`;

const LastActivityTitle = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const LastActivityText = styled(Text)`
  font-size: 14px;
  color: #666;
`;

const ActionsSectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const ActionButtonContainer = styled.View`
  background-color: ${Colors.button};
  padding: 12px 24px;
  border-radius: 8px;
`;

const ActionButtonText = styled(Text)`
  color: ${Colors.white};
  font-size: 16px;
  font-weight: bold;
`;

const InfoCard = styled(Card)`
  background-color: #f8f9fa;
`;

const InfoTitle = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const InfoItem = styled.View`
  margin-bottom: 8px;
`;

const InfoLabel = styled(Text)`
  font-size: 14px;
  color: #666;
`;

const InfoValue = styled(Text)`
  font-size: 14px;
  color: #333;
  marginLeft: 8px;
`;

const RefreshIcon = () => (
  <View>
    {/* Simple refresh icon placeholder */}
    <Text style={{ fontSize: 20 }}>↻</Text>
  </View>
);
