import firebase from 'firebase/app';
import { omitBy, isUndefined, lowerCase } from 'lodash';
import * as constants from './constants';
import 'firebase/auth';
import 'firebase/database';

const USERS_PATH = '/users';
const SURVEYS_PATH = '/surveys';

const config = {
  apiKey: 'AIzaSyCQnvhtra0swrYaGvwSFiavtkKwdwSQd6g',
  authDomain: 'ashoka-social-api.firebaseapp.com',
  databaseURL: 'https://ashoka-social-api.firebaseio.com',
  projectId: 'ashoka-social-api',
  storageBucket: 'ashoka-social-api.appspot.com',
  messagingSenderId: '374901402447'
};

const userValues = (availableValues, userId) => {
  const data = {};
  constants.USER_VALUES.forEach((value) => {
    data[`${USERS_PATH}/${userId}/${value}`] = availableValues[value];
  });
  data[`${USERS_PATH}/${userId}/id`] = userId;
  data[`${USERS_PATH}/${userId}/sortName`] = lowerCase(
    `${availableValues.firstName} ${availableValues.lastName}`
  );
  return omitBy(data, isUndefined);
};

const surveyValues = (availableValues, userId, profileId) => {
  const data = {};
  constants.SURVEY_VALUES.forEach((value) => {
    data[`${SURVEYS_PATH}/${profileId}/${value}`] = availableValues[value];
  });
  data[`${SURVEYS_PATH}/${profileId}/userId`] = userId;
  return omitBy(data, isUndefined);
};

class apiClient {
  constructor() {
    firebase.initializeApp(config);
  }

  authenticated = (callback) => {
    return firebase.auth().onAuthStateChanged(callback);
  }

  login = (email, password) => {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  logout = () => {
    return firebase.auth().signOut();
  }

  requestPasswordReset = (email) => {
    return firebase.auth().sendPasswordResetEmail(email);
  }

  createUser = (details) => {
    const ref = firebase.database().ref();
    const userId = ref.push().key;
    const profileId = ref.push().key;

    const data = {
      ...userValues(details, userId),
      ...surveyValues(details, userId, profileId)
    };

    return ref.update(data).then(() => (userId));
  }

  getUser = (userId) => {
    const ref = firebase.database().ref(`${USERS_PATH}/${userId}`);
    return ref.once('value').then(response => ({ response: response.val() }));
  }

  listUsers = (cursor = null, limit = 10) => {
    const ref = firebase.database().ref(USERS_PATH);
    return ref.orderByChild('firstName')
      .startAt(cursor)
      .limitToFirst(limit)
      .once('value')
      .then(response => ({ response: response.val() }));
  }

  searchUsers = (query) => {
    const ref = firebase.database().ref(USERS_PATH);

    if (!query) {
      return Promise.resolve({ response: [] });
    }

    return ref
      .orderByChild('sortName')
      .startAt(query)
      .endAt(`${query}\u{f8ff}`)
      .once('value')
      .then(response => ({ response: response.val() }));
  }
}

const client = new apiClient();

export default client;
