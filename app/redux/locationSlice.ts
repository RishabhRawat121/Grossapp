import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ILocation {
  longitude?: string;
  latitude?: string;
  name?: string;
}

interface ILocationSlice {
  locationData: ILocation | null;
}

const initialState: ILocationSlice = {
  locationData: null,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<ILocation>) {
      state.locationData = action.payload;
    },
    clearLocation(state) {
      state.locationData = null;
    },
  },
});

export const { setLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;
