"use client"
import React, { useState, useEffect, useRef} from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCaretRight, faCheck, faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { useSelector, useDispatch } from "react-redux";
import { doTourOptDtls } from '@/app/store/tourStore/tour';
import { doFilterSort } from '@/app/store/tourStore/tour';
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
  const tourFilterVar = useSelector((state) => state.tourResultReducer?.tourFltr);

  const srtVal = (val) =>{
    let tourFilterSort = {
      srtVal: val
    }
    let obj = {'tourFilters': tourFilterVar, 'tourFilterSort': tourFilterSort}
    dispatch(doFilterSort(obj));
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
  //console.log("tourOptData", tourOptData)

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

      if(resOptions){
        resOptions?.tourOptions?.map((item) =>{
          let adultPrice = 0;
          let childPrice = 0;

          item.paxPrices.forEach((p) => {
            if(p.paxType === 'ADULT'){
              adultPrice = (Number(p.net) * Number(qry.adults))
            }
            if(qry.children !==0){
              let chdAgesArr = qry.ca.split(',');
              let subChildPrc = 0;
              chdAgesArr.forEach((c) => {
                let arrAges = p.age.split('-');
                let fromAge = Number(arrAges[0]);
                let toAge = Number(arrAges[1]);
                let current = Number(c);
                if (current >= fromAge && current <= toAge){
                  subChildPrc = subChildPrc + (Number(p.net))
                }
              })
              childPrice += subChildPrc;
            }
          })
          
          item.totalAdult = adultPrice;
          item.totalChild = childPrice;
          item.totalPaxPrice = adultPrice+childPrice;
        })
        resOptions?.tourOptions?.sort((a, b) => parseFloat(a.totalPaxPrice) - parseFloat(b.totalPaxPrice));
      }

      if (_.isEmpty(tourOptData)) {
        tourOptItems = {}
      }
      tourOptItems[v.code] = resOptions;
      dispatch(doTourOptDtls(tourOptItems));
    }
  }

  const [policyDtl, setPolicyDtl] = useState(null);
  //console.log("policyDtl", policyDtl)
  // const [fareBrkupData, setFareBrkupData] = useState({});
  // const [fareBrkData, setFareBrkData] = useState(null);
  // console.log("fareBrkData", fareBrkData)

  // const fareBreakkup = async(cat, v) => {
  //   console.log("cat", cat)
  //   setFareBrkData(null);
  //   const fareBrkupObj = {
  //     "CustomerCode": qry.customerCode,
  //     "SearchParameter": {
  //       "DestinationCode": qry.destination[0].destinationCode,
  //       "CountryCode": qry.destination[0].countryCode,
  //       "GroupCode": v.groupCode,
  //       "ServiceDate": qry.chkIn,
  //       "Currency": qry.currency,
  //       "Adult": qry.adults?.toString(),
  //       "TourCode": cat.rateKey,
  //       "TassProField": {
  //         "CustomerCode": qry.customerCode,
  //         "RegionId": qry.regionCode?.toString()
  //       }
  //     }
  //   }

  //   if (parseInt(qry.children) > 0) {
  //     let childrenObj = {}
  //     let arrChildAges = []
  //     let indx = 0
  //     let chdAgesArr = qry.ca.split(',');
  //     for (var k = 0; k < chdAgesArr.length; k++) {
  //       indx = indx + 1
  //       let ageObj = {}
  //       ageObj.Identifier = indx
  //       ageObj.Text = chdAgesArr[k]
  //       arrChildAges.push(ageObj)
  //     }
  //     childrenObj.Count = parseInt(qry.children)
  //     childrenObj.ChildAge = arrChildAges;
  //     fareBrkupObj.SearchParameter.Children = childrenObj
  //   }

  //   if(v.supplierShortCode?.toLowerCase() === 'local'){
  //     fareBrkupObj.SessionId = getTourRes?.generalInfo?.localSessionId
  //   }
  //   else{
  //     fareBrkupObj.SessionId = getTourRes?.generalInfo?.sessionId
  //   }

  //   console.log("fareBrkupObj", fareBrkupObj)

  //   let fbRes = {}
  //   let fbItems = {...fareBrkupData}
  //   if (_.isEmpty(fareBrkupData[cat.tourOptionCode])) {
  //     let responseFarebrkup = null;
  //     if(v.supplierShortCode?.toLowerCase() === 'local'){
  //       responseFarebrkup = TourService.doLocalPriceBreakup(fareBrkupObj, qry.correlationId);
  //     }
  //     else{
  //       responseFarebrkup = TourService.doPriceBreakup(fareBrkupObj, qry.correlationId);
  //     }
  //     const resFarebrkup = await responseFarebrkup;
  //     setFareBrkData(resFarebrkup);
  //     fbRes = resFarebrkup;
  //     if (_.isEmpty(fareBrkupData)) {
  //       fbItems = {}
  //     }
  //     fbItems[cat.tourOptionCode] = fbRes;
  //     setFareBrkupData(fbItems);
  //   }
  //   else{
  //     setFareBrkData(fareBrkupData[cat.tourOptionCode]);
  //   }
    

  // }
  
  
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
                <li className="page-item"><button type="button" onClick={() => handleClick(currentPage + 1)} disabled={Number(currentPage) === Number(pagesCount-1)} className="page-link border-0 text-dark rounded">Next</button></li>
                <li className="page-item"><button type="button" onClick={() => handleClick(pagesCount-1)} disabled={Number(currentPage) === Number(pagesCount-1)} className="page-link border-0 text-dark rounded">Last</button></li>
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
                      <div className="blue fw-semibold fs-5"><small className='fn14'>From</small> {qry?.currency} {parseFloat(v.minPrice).toFixed(2)}</div>
                    </div>
                    <div className="col-auto col-lg-12">
                      <button className="btn btn-success togglePlus px-3 py-1" type="button" onClick={() => tourOption(v)}> &nbsp; Select &nbsp; </button>
                    </div>
                  </div>
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
                              <th className="text-center"><strong>Policy</strong></th>
                              <th><strong>Status</strong></th>
                              <th><strong>Price</strong></th>
                              <th className="text-end">&nbsp;</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tourOptData?.[v.code]?.tourOptions.map((cat, i) => (
                              <tr key={i}>
                                <td className="align-middle">
                                  <div className='text-capitalize'>{cat.tourOptionName?.toLowerCase()}</div>
                                  {/* <div className='fw-normal fn12'>
                                    <a href="#showCancelModal" data-bs-toggle="modal">Fare Breakup</a>&nbsp;|&nbsp;  
                                    <a href="#showCancelModal" data-bs-toggle="modal">Cancellation Policy</a>
                                  </div> */}
                                </td>
                                <td className="align-middle">{cat.transferName}</td>
                                <td className="align-middle text-center"><button type="button" data-bs-toggle="modal" data-bs-target="#policyModal" onClick={()=> setPolicyDtl(cat)} className="btn fn13 fw-semibold btn-link p-0 text-warning">View <FontAwesomeIcon icon={faCaretRight} /></button> </td>
                                <td className="align-middle text-success">{cat.status}</td>
                                <td className="align-middle fs-6 bg-primary bg-opacity-10">{qry.currency} {Number(cat.totalPaxPrice).toFixed(2)}</td>
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

      <div className="modal fade" id="policyModal" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-capitalize">{policyDtl?.tourOptionName?.toLowerCase()} ({policyDtl?.transferName?.toLowerCase()})</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {/* <div>
                <div className="fs-6 fw-semibold mb-2">Fare Summary</div>
                <table className="table table-sm table-bordered">
                  <thead className="table-secondary">
                    <tr>
                      <th>Pax Type</th>
                      <th>Quantity</th>
                      <th>Age</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Adult</td>
                      <td>{qry.adults}</td>
                      <td>{policyDtl?.paxPrices?.[0].age}</td>
                      <td>{policyDtl?.totalAdult}</td>
                    </tr>
                    {policyDtl?.paxPrices?.[0].age

                    }
                    <tr>
                      <td>Child</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    
                  </tbody>

                </table>
              </div> */}

              {policyDtl?.transferTime &&
                <div>
                  <div className="fs-6 fw-semibold mb-2">Timings & Duration</div>
                  <table className="table table-sm table-borderless">
                    <thead className="table-secondary">
                      <tr>
                        <th>Transfers Type</th>
                        <th>Pickup Timings</th>
                        <th>Duration Approx</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{policyDtl?.transferTime?.transferType}</td>
                        <td>{policyDtl?.transferTime?.description}</td>
                        <td>{policyDtl?.transferTime?.duration}</td>
                      </tr>
                    </tbody>

                  </table>
                </div>
              }
              {policyDtl?.tourOptionInfo?.cancellationPolicyDescription &&
                <>
                  <div className="fs-6 fw-semibold mb-1">Cancellation Policy</div>
                  <div className='mb-1' dangerouslySetInnerHTML={{ __html:policyDtl?.tourOptionInfo?.cancellationPolicyDescription}}></div>
                </>
              }
              {policyDtl?.tourOptionInfo?.childPolicyDescription &&
              <>
                <div className="fs-6 fw-semibold mb-1">Child Policy</div>
                <div className='mb-1' dangerouslySetInnerHTML={{ __html:policyDtl?.tourOptionInfo?.childPolicyDescription}}></div>
              </>
              }
            </div> 
          </div>
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