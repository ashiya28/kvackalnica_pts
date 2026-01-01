import leftImg from '../assets/yarn_left.png';
import rightImg from '../assets/yarn_right.png';

function YarnCorner() {
  return (
    <>
      <img
        src={leftImg}
        alt="Yarn Left"
        className="absolute bottom-2 left-5 w-28 h-auto"
      />
      <img
        src={rightImg}
        alt="Yarn Right"
        className="absolute bottom-2 right-5 w-28 h-auto"
      />
    </>
  );
}

export default YarnCorner;
