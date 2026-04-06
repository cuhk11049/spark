type MascotProps = {
  size?: 'sm' | 'md' | 'lg';
  sad?: boolean;
};

export function Mascot({ size = 'md', sad = false }: MascotProps) {
  return (
    <div className={`mascot mascot--${size} ${sad ? 'is-sad' : ''}`}>
      <img src="/ice_bb.png" alt="小冰人" className="mascot__image" />
    </div>
  );
}
