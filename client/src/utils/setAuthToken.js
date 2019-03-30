import axios from "axios";

const setAuthToken = token => {
  if (token) {
    //apply to every call
    axios.defaults.headers.common["Authorization"] = token;
  } else {
    //if token isn't present, delete auth header
    delete axios.defaults.headers.common["Authorization"];
  }
};

export default setAuthToken;
