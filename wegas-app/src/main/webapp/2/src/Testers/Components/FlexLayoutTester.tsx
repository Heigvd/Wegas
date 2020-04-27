import * as React from 'react';
import { cx, css } from 'emotion';
import { flex, flexColumn, grow } from '../../css/classes';
import {
  Container,
  Content,
  Splitter,
} from '../../Components/Layouts/FonkyFlex';

export default function FlexLayoutTester() {
  return (
    <div
      className={cx(flex, flexColumn, css({ width: '100%', height: '500px' }))}
    >
      <div className={grow}>
        <Container>
          <Content>Horizontal 1</Content>
          <Splitter />
          <Content>Horizontal 2</Content>
          <Splitter />
          <Content>Horizontal 3</Content>
        </Container>
      </div>
      <div className={grow}>
        <Container>
          <Content>Horizontal Nosplitter 1</Content>
          <Content>Horizontal Nosplitter 2</Content>
          <Content>Horizontal Nosplitter 3</Content>
        </Container>
      </div>
      <div className={grow}>
        Vertical
        <Container vertical>
          <Content>Vertical 1</Content>
          <Splitter />
          <Content>Vertical 2</Content>
          <Splitter />
          <Content>Vertical 3</Content>
        </Container>
      </div>
    </div>
  );
}
