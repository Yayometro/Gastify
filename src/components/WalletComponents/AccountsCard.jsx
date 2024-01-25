
import React, { useEffect, useState } from 'react'
import AccountCard from './AccountCard';

function AccountsCard({acc}) {
    const [accounts, setAccounts] = useState([]);
    useEffect(() => {
        setAccounts(acc)
    }, [acc])
    console.log(accounts)
  return (
    <div>
        <h1>Accounts Card</h1>
    {accounts
        ? (<div>
            <h1>Accounts:</h1>
            {
                accounts.length > 0 ? (
                    accounts.map((account) => (
                        <AccountsCard accountObj={account} key={account._id}/>
                    ))
                ) : (
                    <div>
                        Not accounts founded 🤕
                    </div>
                )
            }
         </div>)
         : (<div>
            <p>No accunts founded</p>
         </div>)
    }
    </div>
  )
}

export default AccountsCard