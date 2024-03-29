import { createSlice } from "@reduxjs/toolkit";
import cloneDeep from 'lodash/cloneDeep';

const initialState = {
  htlResObj:null,
  htlResOrgObj:null,
  htlFltr: {
    priceFilter: [],
    startRating: [],
    triptRating: [],
    supplierFil: [],
    srchTxt:''
  },
  htlFilterSort : {
    srtVal: '0'
  },
  roomDtls:{},
  repriceDtls:null,
  htlDtls:null,
};

export const hotelResult = createSlice({
  name: "hotelResult",
  initialState,
  reducers: {
    doHotelSearchOnLoad:  (state, action) => {
      state.htlResObj = action.payload
      state.htlResOrgObj = action.payload
    },
    doFilterSort:  (state, action) => {
      if(state.htlResOrgObj){
        let obj = action.payload
        let htlResult = cloneDeep(state.htlResOrgObj)
        const fltrResPr = htlResult.hotels.b2BHotel.filter((o) => {
          let status = []
          if (obj.htlFilters.priceFilter.length > 0) {
              status.push(o.minPrice >= obj.htlFilters.priceFilter[0] && o.minPrice <= obj.htlFilters.priceFilter[1])
          }
          let statusVar = status.includes(false)
          return !statusVar
        });
  
        const fltrResSt = fltrResPr.filter((o) => {
          let status = []
          if (obj.htlFilters.startRating.length > 0) {
              status.push(obj.htlFilters.startRating.includes(o.starRating))
            } 
          let statusVar = status.includes(false)
          return !statusVar
        });
  
        const fltrResTrip = fltrResSt.filter((o) => {
          let status = []
          if (obj.htlFilters.triptRating.length > 0) {
              status.push(obj.htlFilters.triptRating.includes(o.tripAdvisorRating))
            } 
          let statusVar = status.includes(false)
          return !statusVar
        });

        const fltrResSupplier = fltrResTrip.filter((o) => {
          let status = []
          if (obj.htlFilters.supplierFil.length > 0) {
              status.push(obj.htlFilters.supplierFil.includes(o.supplierName?.toLowerCase()))
            } 
          let statusVar = status.includes(false)
          return !statusVar
        });
  
        if(obj.htlFilterSort.srtVal !== '0'){
          switch (obj.htlFilterSort.srtVal) {
            case 'nameAsc':
              fltrResTrip.sort((a, b) => a.productName.localeCompare(b.productName))
            break
            case 'nameDesc':
              fltrResTrip.sort((a, b) => b.productName.localeCompare(a.productName))
            break
  
            case 'priceLow':
              fltrResTrip.sort((a, b) => parseFloat(a.minPrice) - parseFloat(b.minPrice))
            break
            case 'priceHigh':
              fltrResTrip.sort((a, b) => parseFloat(b.minPrice) - parseFloat(a.minPrice))
            break
            case 'starmin':
              fltrResTrip.sort((a, b) => parseFloat(a.starRating) - parseFloat(b.starRating))
            break
            case 'starmax':
              fltrResTrip.sort((a, b) => parseFloat(b.starRating) - parseFloat(a.starRating))
            break
            case 'trpadvsrmin':
              fltrResTrip.sort((a, b) => parseFloat(a.tripAdvisorRating) - parseFloat(b.tripAdvisorRating))
            break
            case 'trpadvsrmax':
              fltrResTrip.sort((a, b) => parseFloat(b.tripAdvisorRating) - parseFloat(a.tripAdvisorRating))
            break
          }
        }
  
        if (obj.htlFilters.srchTxt !== '') {
          const srtTxtRes = fltrResSupplier.filter((pdt) => {
            return pdt.productName.toLowerCase().includes(obj.htlFilters.srchTxt.toLowerCase())
          })
          htlResult.hotels.b2BHotel = srtTxtRes
        }
        else{
          htlResult.hotels.b2BHotel = fltrResSupplier
        }
        state.htlFltr = obj.htlFilters
        state.htlFilterSort = obj.htlFilterSort
        state.htlResObj = htlResult
      }
     

    },

    doRoomDtls:  (state, action) => {
      state.roomDtls = action.payload
    },

    doHotelReprice: (state, action) => {
      state.repriceDtls = action.payload;
    },

    doHotelDtl: (state, action) => {
      state.htlDtls = action.payload;
    },
    
  }

});

export const { doHotelSearchOnLoad, doFilterSort, doRoomDtls, doHotelReprice, doHotelDtl } = hotelResult.actions

export default hotelResult.reducer;