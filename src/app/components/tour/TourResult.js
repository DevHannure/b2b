"use client"
import React, { useState, useEffect, useRef} from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCaretRight, faCheck, faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import DataTable from 'react-data-table-component';
import { useSelector, useDispatch } from "react-redux";
import { doTourOptDtls } from '@/app/store/tourStore/tour';
import HotelService from '@/app/services/hotel.service';
import {format, addDays} from 'date-fns';
import AES from 'crypto-js/aes';
import { enc } from 'crypto-js';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import TourService from '@/app/services/tour.service';

export default function TourResult(props) {
  const router = useRouter();
  const qry = props.TurReq;
  const _ = require("lodash");
  const dispatch = useDispatch();
  const getTourRes = useSelector((state) => state.tourResultReducer?.tourResObj);
  const getOrgTourResult = useSelector((state) => state.tourResultReducer?.tourResOrgObj);

  const srtVal = (val) =>{
    // let htlFilterSort = {
    //   srtVal: val
    // }
    // let obj = {'htlFilters': htlFilterVar, 'htlFilterSort': htlFilterSort}
    // dispatch(doFilterSort(obj));
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(70);  
  const [pagesCount, setPagesCount] = useState(0);

  useEffect(()=>{
    setPagesCount(Math.ceil(getTourRes?.tours?.length / pageSize))
    setCurrentPage(0);
  },[getTourRes]);

  const handleClick = (inde) => {
    setCurrentPage(inde)
  };

  const tourOptData = useSelector((state) => state.tourResultReducer?.tourOptDtls);
  const [tourCollapse, setTourCollapse] = useState('');

  const tourOption = async(v) => {
    let tourCollapseCode = '#tour'+v.code;
    if(tourCollapseCode!==tourCollapse){
      setTourCollapse(tourCollapseCode)
    }
    else{
      setTourCollapse('')
    }
    const tourOptionObj = {
      "CustomerCode": qry.customerCode,
      "SearchParameter": {
        "DestinationCode": qry.destination[0].destinationCode,
        "CountryCode": qry.destination[0].countryCode,
        "GroupCode": v.groupCode,
        "ServiceDate": qry.chkIn,
        "Currency": qry.currency,
        "Adult": qry.adults?.toString(),
        "TourCode": v.tourCode,
        "TassProField": {
          "CustomerCode": qry.customerCode,
          "RegionId": qry.regionCode?.toString()
        }
      }
    }

    if (parseInt(qry.children) > 0) {
      let childrenObj = {}
      let arrChildAges = []
      let indx = 0
      let chdAgesArr = qry.ca.split(',');
      for (var k = 0; k < chdAgesArr.length; k++) {
        indx = indx + 1
        let ageObj = {}
        ageObj.Identifier = indx
        ageObj.Text = chdAgesArr[k]
        arrChildAges.push(ageObj)
      }
      childrenObj.Count = parseInt(qry.children)
      childrenObj.ChildAge = arrChildAges;
      tourOptionObj.SearchParameter.Children = childrenObj
    }

    if(v.supplierShortCode?.toLowerCase() === 'local'){
      tourOptionObj.SessionId = getTourRes?.generalInfo?.localSessionId
    }
    else{
      tourOptionObj.SessionId = getTourRes?.generalInfo?.sessionId
    }

    let tourOptItems = {...tourOptData}
    if (_.isEmpty(tourOptData[v.code])) {
      let responseOptions = null;
      if(v.supplierShortCode?.toLowerCase() === 'local'){
        responseOptions = TourService.doLocalOptions(tourOptionObj, qry.correlationId);
      }
      else{
        responseOptions = TourService.doOptions(tourOptionObj, qry.correlationId);
      }
      let resOptions = await responseOptions;
      if (_.isEmpty(tourOptData)) {
        tourOptItems = {}
      }
      tourOptItems[v.code] = resOptions;
      dispatch(doTourOptDtls(tourOptItems));
    }
  }

  const fareBreakkup = async(v) => {
    const fareBrkupObj = {
      "CustomerCode": qry.customerCode,
      "SearchParameter": {
        "DestinationCode": qry.destination[0].destinationCode,
        "CountryCode": qry.destination[0].countryCode,
        "GroupCode": v.groupCode,
        "ServiceDate": qry.chkIn,
        "Currency": qry.currency,
        "Adult": qry.adults?.toString(),
        "TourCode": v.tourCode,
        "TassProField": {
          "CustomerCode": qry.customerCode,
          "RegionId": qry.regionCode?.toString()
        }
      }
    }

    if (parseInt(qry.children) > 0) {
      let childrenObj = {}
      let arrChildAges = []
      let indx = 0
      let chdAgesArr = qry.ca.split(',');
      for (var k = 0; k < chdAgesArr.length; k++) {
        indx = indx + 1
        let ageObj = {}
        ageObj.Identifier = indx
        ageObj.Text = chdAgesArr[k]
        arrChildAges.push(ageObj)
      }
      childrenObj.Count = parseInt(qry.children)
      childrenObj.ChildAge = arrChildAges;
      fareBrkupObj.SearchParameter.Children = childrenObj
    }

    if(v.supplierShortCode?.toLowerCase() === 'local'){
      tourOptionObj.SessionId = getTourRes?.generalInfo?.localSessionId
    }
    else{
      tourOptionObj.SessionId = getTourRes?.generalInfo?.sessionId
    }

  }
  
  
  return (
    <>
    {getTourRes?.tours.length ?  
    <>
      <div className="d-lg-table-cell align-top rightResult border-start">

        <div className="row g-2 mb-3 align-items-center">
          <div className="col-lg-2">
            <select className="form-select form-select-sm" onChange={event => srtVal(event.target.value)}>
              <option value="0">Sort By</option>
              <option value="nameAsc">Name Asc</option>
              <option value="nameDesc">Name Desc</option>
              <option value="priceLow">Price Low to High</option>
              <option value="priceHigh">Price High to Low</option>
            </select>
          </div>
          <div className="col-lg-8 d-none d-lg-block">
            <nav>
              <ul className="pagination pagination-sm justify-content-center m-0">
                <li className="page-item"><button type="button" onClick={() => handleClick(0)} disabled={currentPage <= 0} className="page-link border-0 text-dark rounded">First</button></li>
                <li className="page-item"><button type="button" onClick={() => handleClick(currentPage - 1)} disabled={currentPage <= 0} className="page-link border-0 text-dark rounded">Previous</button></li>
                {[...Array(pagesCount)].map((page, i) => 
                  <li key={i} className="page-item"><button type="button" onClick={() => handleClick(i)} className={"page-link border-0 rounded " + (i === currentPage ? 'active' : '')}>{i + 1}</button></li>
                )}
                <li className="page-item"><button type="button" onClick={() => handleClick(currentPage + 1)} className="page-link border-0 text-dark rounded">Next</button></li>
                <li className="page-item"><button type="button" onClick={() => handleClick(pagesCount-1)} className="page-link border-0 text-dark rounded">Last</button></li>
              </ul>
            </nav>
          </div>
          <div className="col-lg-2 text-end" data-xml={getOrgTourResult?.generalInfo?.sessionId} data-local={getOrgTourResult?.generalInfo?.localSessionId}>Total Result Found: {getOrgTourResult?.tours?.length}</div>
        </div>
    
        <div>
          {getTourRes?.tours?.slice(currentPage * pageSize,(currentPage + 1) * pageSize).map((v, index) => {
          return (
            <div key={index} className="htlboxcol rounded mb-4 shadow-sm p-2">
              <div className={"row " + (tourCollapse==='#tour'+v.code ? 'colOpen':'collapsed')} aria-expanded={tourCollapse==='#tour'+v.code}>
                <div className='col-md-3'>
                  <div className='position-relative rounded w-100 h-100 overflow-hidden'>
                    {v.imagePath ?
                    <Image src={v.imagePath} alt={v.name} fill style={{objectFit:'cover', objectPosition:'center'}} priority />
                    :
                    <Image src='/images/noHotelThumbnail.jpg' alt={v.name} width={140} height={90} priority={true} className='rounded' style={{width:'100%', height:'auto'}} />
                    }
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className="blue fw-semibold fs-6 text-capitalize">{v.name?.toLowerCase()}</div>
                  {v.rating &&
                    <div className='my-2 text-muted'>
                      {Array.apply(null, { length:5}).map((e, i) => (
                      <span key={i}>
                        {i+1 > parseInt(v.rating) ?
                        <FontAwesomeIcon key={i} icon={faStar} className="starBlank" />
                        :
                        <FontAwesomeIcon key={i} icon={faStar} className="starGold" />
                        }
                      </span>
                      ))
                      }
                      <span>&nbsp; ({v.reviewCount} Reviews)</span>
                    </div>
                  }

                  {v.tourShortDescription &&
                    <div className="text-muted fn13" dangerouslySetInnerHTML={{ __html: v.tourShortDescription?.substring(0,180)+'...' }}></div>
                  }
                  <ul className="list-unstyled mt-2 fw-semibold">
                    <li className='mb-1'><FontAwesomeIcon icon={faCheck} className="text-success" /> Instant Confirmation</li>
                    {v.cancellationPolicyName &&
                      <li className='mb-1'><FontAwesomeIcon icon={faCheck} className="text-success" /> {v.cancellationPolicyName}</li>
                    }
                  </ul>
                </div>
                <div className='col-md-3'>
                  <div className="row gx-2 text-center h-100">
                    <div className="col-auto col-lg-12">
                      <div className='mb-1'><span className='bg-success-subtle rounded fn10 px-2 py-1'>Cheapest with {v.supplierShortCode}</span></div>
                      <div className="blue fw-semibold fs-5">{qry?.currency} {parseFloat(v.minPrice).toFixed(2)}</div>
                    </div>
                    <div className="col-auto col-lg-12">
                      <button className="btn btn-success togglePlus px-3 py-1" type="button" onClick={() => tourOption(v)}> &nbsp; Select &nbsp; </button>
                    </div>
                  </div>
                  
                  {/* <div className="d-flex d-lg-block justify-content-between text-center px-lg-0 px-1">
                    <div>
                      <div className='mb-1'><span className='bg-success-subtle rounded fn10 px-2 py-1'>Cheapest with HotelRack</span></div>
                      <div className="blue fw-semibold fs-6">AED 86.90</div>
                    </div>
                    <div>
                      <button className="btn btn-success togglePlus px-3 py-1" type="button"> &nbsp; Select &nbsp; </button>
                    </div>
                  </div> */}

                </div>
               
              </div>

              <div className={"collapse "+(tourCollapse==='#tour'+v.code ? 'show':'')}>
                <div>
                {tourOptData?.[v.code] ?
                    <>
                    {tourOptData?.[v.code]?.tourOptions?.length ?
                    <div className="mt-2">
                      <div className="table-responsive">
                        <table className="table table-hover mb-0 border fn13 fw-semibold">
                            <thead className="table-light fn14">
                                <tr>
                                    <th className="text-nowrap"><strong>Excursion Option</strong></th>
                                    <th className="text-nowrap"><strong>Transfer Option</strong></th>
                                    {/* <th className="text-center"><strong>Policy</strong></th> */}
                                    <th><strong>Status</strong></th>
                                    <th><strong>Price</strong></th>
                                    <th className="text-end">&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tourOptData?.[v.code]?.tourOptions.map((cat, i) => (
                                  <tr key={i}>
                                      <td className="align-middle">
                                        <div className='text-capitalize mb-1'>{cat.tourOptionName?.toLowerCase()}</div>
                                        <div className='fw-normal fn12'>
                                          <a href="#fareBrkupModal" data-bs-toggle="modal" onClick={()=> fareBreakkup(v)}>Fare Breakup</a>&nbsp;|&nbsp;  
                                          <a href="#showCancelModal" data-bs-toggle="modal">Cancellation Policy</a>
                                        </div>
                                      </td>
                                      <td className="align-middle">{cat.transferName}</td>
                                      {/* <td className="align-middle text-center"><button type="button" className="btn fn13 fw-semibold btn-link p-0 text-warning">View <FontAwesomeIcon icon={faCaretRight} /></button> </td> */}
                                      <td className="align-middle text-success">{cat.status}</td>
                                      <td className="align-middle fs-6 bg-primary bg-opacity-10">AED 86.90</td>
                                      <td className="align-middle fs-6 bg-warning text-white text-center curpointer">Book Now</td>
                                      {/* {cat.localField ?
                                      <td className="align-middle text-nowrap">{getCurrency.currency} {parseFloat(cat.localField.totalNet).toFixed(2)}</td>
                                      :
                                      <td className="align-middle text-nowrap">{getCurrency.currency} {parseFloat(cat.finalAmount).toFixed(2)}</td>
                                      }
                                      <td className="align-middle text-end">
                                          {cat.isSlot ? 
                                          <Button variant="warning" size="sm" onClick={()=> timeSlot(cat)}>&nbsp;{t("Select")}&nbsp;</Button>
                                          :
                                          <Button variant="warning" size="sm" onClick={()=> avlbTour(cat)} className="text-nowrap">&nbsp;{t("BookNow")}&nbsp;</Button>
                                          }
                                      </td> */}
                                  </tr>
                                ))
                                }
                            </tbody>
                        </table>
                    </div>
                      
                    </div>
                    :
                    <div className='fs-5 text-center mt-2'>No Tour Option Found</div>
                    }
                    </>
                    :
                    <div className='text-center blue my-3'>
                      <span className="fs-5 align-middle d-inline-block"><strong>Getting Cheapest Tour Option Rates For You..</strong></span>&nbsp; 
                      <div className="dumwave align-middle">
                        <div className="anim anim1" style={{backgroundColor:"#06448f",marginRight:"3px"}}></div>
                        <div className="anim anim2" style={{backgroundColor:"#06448f",marginRight:"3px"}}></div>
                        <div className="anim anim3" style={{backgroundColor:"#06448f",marginRight:"3px"}}></div>
                      </div>
                    </div>
                    }
                </div>
              </div>
    
            </div>
          )
          })}
        </div>
        

      </div>

    </>
    :
    <div className="d-lg-table-cell align-top rightResult border-start"> 
      <div className="text-center my-5">
        <div><Image src="/images/noResult.png" alt="No Result Found" width={464} height={344} priority={true} /></div>
        <div className="fs-3 fw-semibold mt-1">No Result Found</div>
      </div>
    </div>
    }
    </>
  )
}
