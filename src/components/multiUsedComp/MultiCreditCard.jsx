import React, { useEffect, useState } from "react";
import "@/components/animations.css";
import CreditCard from "./CreditCard";
import randomColor from "randomcolor";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccounts } from "@/lib/features/accountsSlice";
import { fetchUser } from "@/lib/features/userSlice";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import { Skeleton } from "antd";

function MultiCreditCard({ acc, user, trans, mccSession }) {
  let [userName, setUserName] = useState("");
  let [allTransactions, setAllTransactions] = useState([]);
  let [accounts, setAccounts] = useState([]);
  let [cardColors, setCardColors] = useState([]);
  //Redux
  // const dispatch = useDispatch()
  // const ccUser = useSelector((state) => state.userReducer)
  // const ccAccounts = useSelector((state) => state.accountsReducer)
  // const ccTransacciones = useSelector((state) => state.transacctionsReducer)
  // //
  // console.log(ccUser)
  // console.log(ccAccounts)
  // console.log(ccTransacciones)
  // //
  // const rdxUser = ccUser.data;
  // const rdxAcc = ccAccounts.data;
  // const rdxTransacciones = ccTransacciones.data;
  // //
  // console.log(rdxUser)
  // console.log(rdxAcc)
  // console.log(rdxTransacciones)

  // // INIT USEEFFECT
  // useEffect(() => {
  //   if(ccUser.status == 'idle'){
  //     console.log('first')
  //     dispatch(fetchUser(mccSession))
  //   }
  //   // Account
  //   if(ccAccounts.status == 'idle'){
  //     console.log('first') 
  //     dispatch(fetchAccounts(mccSession))
  //   }
  //   //Transactions
  //   if(ccTransacciones.status == 'idle'){
  //     console.log('first')
  //     dispatch(fetchTrans(mccSession))
  //   }
  // }, [])
  //
  // useEffect(() => {
    // if(ccUser.status == 'succeeded' && ccAccounts.status == 'succeeded' && ccTransacciones.status == 'succeeded'){
    //   console.log(rdxAcc)
    //   console.log(rdxTransacciones)
    //   setUserName(rdxUser.fullName);
    //   setAllTransactions(rdxTransacciones);
    //   setAccounts(rdxAcc);
    //   const initialCardColors = rdxAcc.map((acc, index) => generateColors(index));
    //   setCardColors(initialCardColors);
    // }
  //   if (rdxUser && rdxAcc.length > 0 && rdxTransacciones.length > 0) {
  //     console.log(rdxAcc)
  //     console.log(rdxTransacciones)
  //     setUserName(rdxUser.fullName);
  //     setAllTransactions(rdxTransacciones);
  //     setAccounts(rdxAcc);
  //     const initialCardColors = rdxAcc.map((acc, index) => generateColors(index));
  //     setCardColors(initialCardColors);
  //   }
  // }, [rdxUser, rdxAcc, rdxTransacciones]);
  useEffect(() => {
    if (user && acc.length > 0 && trans.length > 0) {
      // console.log(user)
      // console.log(acc)
      // console.log(trans)
      setUserName(user.fullName || user);
      setAllTransactions(trans);
      setAccounts(acc);
      const initialCardColors = acc.map((acc, index) => generateColors(index));
      setCardColors(initialCardColors);
    }
  }, [user, acc, trans]);

  const handleHover = (index) => {
    //create a new array and added the zIndex calc
    const updatedAccounts = accounts.map((acco, i) => ({
      ...acco,
      zIndex: i === index ? accounts.length * 10 : accounts.length - i,
    }));

    setAccounts(updatedAccounts); //update based on hover
  };

  const generateColors = (index) => {
    if (index === 0)
      return "linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(18,127,205,1) 100%)";
    if (index === 1)
      return "linear-gradient(90deg, rgba(190,17,210,1) 0%, rgba(210,17,17,1) 100%)";
    if (index === 2)
      return "linear-gradient(90deg, rgba(180,58,58,1) 0%, rgba(205,129,18,1) 100%)";
    if (index === 3)
      return "linear-gradient(90deg, rgba(58,59,180,1) 0%, rgba(17,162,210,1) 100%)";
    if (index >= 4) {
      const color1 = randomColor();
      const color2 = randomColor();
      return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
    }
  };

  // ...

  return (
    <div className="w-full overflow-x-hidden flex flex-col">
      <div className="header text-center">
        <h1 className="movement-title text-black text-2xl text-center font-bold py-4">
            Accounts resume
        </h1>
      </div>
      <div className="flex flex-row pb-6 px-1 overflow-x-scroll">
      {accounts && accounts.length > 0
        ? accounts.map((ac, index) => (
              <CreditCard
                acc={ac}
                user={userName}
                trans={allTransactions}
                cardColor={cardColors[index]}
                key={ac._id}
              />
          ))
        : (
          <div className="w-[80%]" >
            <Skeleton active />
          </div>
        )
        }
      </div>
    </div>
  );
}

export default MultiCreditCard;

//
/*
FUNCT to randomly change the color:
const generateRandomColors = (index) => {
    const color1 = randomColor();
    const color2 = randomColor();

    return `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
  };


*/
