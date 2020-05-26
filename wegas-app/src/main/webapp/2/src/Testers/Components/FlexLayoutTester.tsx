import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexColumn, grow } from '../../css/classes';
import {
  FonkyFlexContainer,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from '../../Components/Layouts/FonkyFlex';

export default function FlexLayoutTester() {
  return (
    <div
      className={cx(flex, flexColumn, css({ width: '100%', height: '500px' }))}
    >
      <div className={grow}>
        <FonkyFlexContainer>
          <FonkyFlexContent>Horizontal 1</FonkyFlexContent>
          <FonkyFlexSplitter />
          <FonkyFlexContent>Horizontal 2</FonkyFlexContent>
          <FonkyFlexSplitter />
          <FonkyFlexContent>Horizontal 3</FonkyFlexContent>
        </FonkyFlexContainer>
      </div>
      <div className={grow}>
        <FonkyFlexContainer>
          <FonkyFlexContent>Horizontal Nosplitter 1</FonkyFlexContent>
          <FonkyFlexContent>Horizontal Nosplitter 2</FonkyFlexContent>
          <FonkyFlexContent>Horizontal Nosplitter 3</FonkyFlexContent>
        </FonkyFlexContainer>
      </div>
      <div className={grow}>
        Vertical
        <FonkyFlexContainer vertical>
          <FonkyFlexContent>Vertical 1</FonkyFlexContent>
          <FonkyFlexSplitter />
          <FonkyFlexContent>Vertical 2</FonkyFlexContent>
          <FonkyFlexSplitter />
          <FonkyFlexContent>Vertical 3</FonkyFlexContent>
        </FonkyFlexContainer>
      </div>
    </div>
  );
}
