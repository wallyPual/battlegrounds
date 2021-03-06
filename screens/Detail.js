import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ImageBackground,
  RefreshControl
} from 'react-native';
import styled from 'styled-components';
import axios from 'axios';
import { API_END_POINT, API_KEY } from '../env';
import List from '../components/List';
import Loader from '../components/Loader';
// import { userData } from '../dummyData';

const { width } = Dimensions.get('screen');

const Container = styled.View`
  padding-bottom: 20px;
  flex: 1;
  align-items: flex-start;
  justify-content: flex-start;
  background-color: #f1f1f1;
`;

const ProfileText = styled.Text`
  padding-top: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.75);
  font-size: 35px;
  color: #fff;
`;

const Detail = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [resultData, setResultData] = useState({});
  const username = navigation.getParam('username');
  const platform = navigation.getParam('platform', 'kakao');

  async function fetchUrl(type) {
    try {
      type === 'refresh' ? setRefresh(true) : setLoading(true);

      let accountId = '';
      let seasonId = '';

      // Set default authorization
      axios.defaults.headers.common['Authorization'] = `Bearer ${API_KEY}`;
      axios.defaults.headers.common['Accept'] = 'application/vnd.api+json';

      await axios
        .get(
          `${API_END_POINT}/${platform}/players?filter[playerNames]=${username}`
        )
        .then(res => {
          const { status } = res;

          if (status === 200) {
            const {
              data: { data }
            } = res;

            data.map(prop => (accountId = prop.id));
          }
        })
        .catch(err => {
          console.log({
            errN: 'user account id',
            err
          });
        });

      // GET seasons
      await axios
        .get(`${API_END_POINT}/${platform}/seasons`)
        .then(res => {
          const { status } = res;
          if (status === 200) {
            const {
              data: { data }
            } = res;

            data.map(
              obj => obj.attributes.isCurrentSeason && (seasonId = obj.id)
            );
          }
        })
        .catch(err => console.log({ errN: 'seasons', err }));

      // GET user season profile
      await axios
        .get(
          `${API_END_POINT}/${platform}/players/${accountId}/seasons/${seasonId}`
        )
        .then(async res => {
          const { status } = res;
          if (status === 200) {
            const {
              data: { data }
            } = res;

            let newObject = {};
            let resultObject = {};

            await Object.keys(
              data.attributes.gameModeStats
            ).map(object => {
              if (
                object !== 'solo-fpp' &&
                object !== 'duo-fpp' &&
                object !== 'squad-fpp'
              ) {
                newObject[object] = data.attributes.gameModeStats[object];
              }
            });
            const objectToArray =
              await Object.keys(newObject).map(key => {
                return [key, newObject[key]];
              });
            await objectToArray.unshift(...objectToArray.splice(1,1));
            await objectToArray.map(arr => {
              return (resultObject[arr[0]] = arr[1]);
            });
            setResultData(resultObject);
          }
        })
        .catch(err => console.log({ errN: 'stat', err }));
    } catch (err) {
      console.log({ errN: 'catch', err });
      type === 'refresh' ? setRefresh(false) : setLoading(false);
    } finally {
      type === 'refresh' ? setRefresh(false) : setLoading(false);
    }
  }

  useEffect(() => {
    fetchUrl();
  }, []);

  return (
    <>
      {loading ? (
        <Loader />
      ) : resultData && resultData.duo ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => fetchUrl('refresh')}
            />
          }
        >
          <Container>
            <ImageBackground
              source={require('../assets/username.jpg')}
              style={{
                marginBottom: 15,
                width: width,
                height: 150,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <ProfileText>{username}님의 전적</ProfileText>
            </ImageBackground>
            {Object.values(resultData).map((prop, idx) => (
              <List key={idx} {...prop} index={idx} />
            ))}
          </Container>
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text>검색결과가 없습니다.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default Detail;
