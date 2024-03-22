import React, { useState, useEffect, useRef } from "react";
import { View, StatusBar, FlatList } from "react-native";
import styled from "styled-components/native";
import AddInput from "./Components/AddInput";
import TodoList from "./Components/TodoList";
import * as Font from "expo-font";
import AppLoading from "expo-app-loading";
import Empty from "./Components/Empty";
import Header from "./Components/Header";
// https://react-native-async-storage.github.io/async-storage/docs/usage#importing
import AsyncStorage from '@react-native-async-storage/async-storage';
// https://docs.expo.dev/versions/latest/sdk/location/
import * as Location from 'expo-location';
 
const getFonts = () =>
  Font.loadAsync({
    "poppins-regular": require("./assets/fonts/Poppins/Poppins-Regular.ttf"),
    "poppins-bold": require("./assets/fonts/Poppins/Poppins-Bold.ttf"),
  });
  
export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [data, setData] = useState([{key: 0.5, value: "oi!"}]);  
    
  // https://react-native-async-storage.github.io/async-storage/docs/usage#storing-object-value
  const storeData = async (key,value) => {
    console.log("storeData key",key, "value(s)", value);
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
      // saving error 
      console.log("storeData failure");
      console.log(e);
    } 
  }  
  // https://react-native-async-storage.github.io/async-storage/docs/usage#reading-data
  const getData = async (key) => {
    console.log("getData called for",key);
    try {
      const value = await AsyncStorage.getItem(key);
      if(value !== null) {
        // value previously stored
        console.log("getData key",key,"retrieved string", value);
        setData(JSON.parse(value));
      }  
    } catch(e) {
      // error reading value
      console.log("getData failure");
      console.log(e);
      setData([]);
    } 
  }   
  const removeValue = async () => {
    console.log("removal called");
    try {
      await AsyncStorage.removeItem('tasks')
    } catch(e) {
      console.log("removal failure");
    }
    console.log('Done.')
  }
 
  // https://jasonwatmore.com/post/2021/08/27/react-how-to-check-if-a-component-is-mounted-or-unmounted
  const mounted = useRef(false);

  useEffect(() => {
    console.log('mounted');
    mounted.current = true;
    //removeValue();
    getData("tasks");
    return () => {
      console.log('unmounting...');
      mounted.current = false;
    }  
  }, [])  // <-- add this empty array here for mount and unmount  
     
 // https://reactjs.org/docs/hooks-effect.html#example-using-hooks
 useEffect(() => {
    // This is be executed when `data` state changes
    //storeData("tasks",data); 
    if (mounted.current) storeData("tasks",data); 
  }, [data]);
      

  // https://docs.expo.dev/versions/latest/sdk/location/#usage
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
      console.log('Permission to access location was granted');
      //let location = await Location.getCurrentPositionAsync({});
      //console.log(location);
    })();
  }, []);
 
 
  const locate = async (key,data) => {
    console.log('locate called',key,data);
    let location = await Location.getCurrentPositionAsync({});
    // location object has many properties, remove most but retain 3 or 4 more useful ones?
    console.log(key, location, data);
    const locatedTaskList = data.map(todo => {
    // if this task has the same ID as the added task
      if (key === todo.key) {
        console.log(key, todo.key,"matched"); 
        console.log({...todo, location: location});
        return {...todo, location: location};
      }  
      console.log(key, todo.key,"unmatched"); 
      return todo;
    });    
    console.log(locatedTaskList)
    setData(locatedTaskList);    
  }
  
  const submitHandler = (value) => {
    const key = Math.random().toString();
    const anotherTodo = (prevTodo,key) => {
      return [
        {
          value: value,
          key: key,
        },
        ...prevTodo,
      ];    
    };
    console.log("submitHandler before add",data); 
    setData(anotherTodo);  
    console.log("submitHandler after add",data); 
    locate(key,anotherTodo(data,key));
  };     
                    
  const deleteItem = (key) => {
    const stillTodo = (prevTodo) => {
      return prevTodo.filter((todo) => todo.key != key);
    };  
    setData(stillTodo);
    console.log("delete from",data,"using key", key);
  };                    
                                 
  if (fontsLoaded) { 
    return (
      <ComponentContainer>
        <View>
          <StatusBar barStyle="light-content" backgroundColor="midnightblue" />
        </View>
         
        <View> 
          <FlatList
            data={data}
            ListHeaderComponent={() => <Header />}
            ListEmptyComponent={() => <Empty />}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => <TodoList item={item} deleteItem={deleteItem} />}
          />
          <View>
            <AddInput submitHandler={submitHandler} />
          </View>
        </View>
      </ComponentContainer>
    );
  } else {
    return (
      <AppLoading
        startAsync={getFonts}
        onFinish={() => {
          setFontsLoaded(true);
        }}
        onError={console.warn}
      />
    );
  }
}
 
const ComponentContainer = styled.View`
  background-color: midnightblue;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
 