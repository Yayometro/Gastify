

import React, { useState } from 'react'

function AccountCard({accountObj}) {
    const [account, setAccount] = useState({});
    if(accountObj){
        console.log('first')
        setAccount(account)
    }
    console.log(account)
  return (
    <div>
        {
            account ? (
                <div>
                    <h1>Account</h1>
                </div>
            ) : (
                <div>
                    No account founded 🤕
                </div>
            )
        }
    </div>
  )
}

export default AccountCard