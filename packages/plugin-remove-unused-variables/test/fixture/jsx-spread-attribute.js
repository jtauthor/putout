const React = require('react');

const fn = () => {
    const spread = true;
  
    return (
      <div
        {...{
          spread,
        }}
      />
    );
}

const simple = (props) => (<div {...props}/>);

