interface ClassStyleId {
  /**
   * className - the class to apply to the list
   */
  className?: string;
  /**
   * style - the style to apply to the list (always prefer className over style to avoid messing with original behaviour of the list)
   */
  style?: React.CSSProperties;
  /**
   * id - a unique identifier to set on a wegas component
   */
  id?: string;
}
