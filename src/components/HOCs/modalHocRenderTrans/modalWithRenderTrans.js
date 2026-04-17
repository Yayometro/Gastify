
export default function modalWithRenderTrans(WrappedComponent, rest){

    const props = {
        
    ...rest
    }
    return <WrappedComponent {...props}/>
}